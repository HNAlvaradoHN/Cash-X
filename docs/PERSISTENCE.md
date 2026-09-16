# Persistencia y plataforma de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** persistencia local estructurada, build Android, reapertura WebView, comprobantes `Blob`, reproducibilidad y backup externo validados; Google Drive y pruebas físicas pendientes

## Objetivo

Mantener una sola base de código para PWA y Android, priorizando integridad de datos, simplicidad, mantenimiento y operación offline.

## Decisión v0.1

- TypeScript + Vite como base.
- PWA offline-first.
- Android mediante Capacitor, sin reescribir dominio/UI en Kotlin.
- IndexedDB mediante Dexie para datos estructurados locales tanto en PWA como dentro de Android WebView.
- Acceso únicamente mediante contratos de persistencia; UI no toca Dexie directamente.
- Comprobantes detrás de `AttachmentStore`.
- Primer adaptador de comprobantes: `DexieAttachmentStore` con `Blob` en IndexedDB.
- Backup externo: archivo único `.cashx` versionado, independiente de nube.
- Google Drive opcional detrás de `CloudSyncProvider`; sin backend propio de Cash-X.
- SQLite queda como alternativa futura solo si evidencia real justifica migrar.

## Datos estructurados

El adaptador Dexie cubre libros, ingresos/egresos, categorías, campo adicional, Papelera, metadatos de comprobantes, configuración y versiones de esquema. Operaciones relacionadas que deban ser atómicas usan transacciones.

## Comprobantes

`AttachmentStore` separa el dominio y los casos de uso de la tecnología concreta de archivos. El primer adaptador, `DexieAttachmentStore`, persiste metadatos y `Blob` en IndexedDB.

PR #23 validó:

- guardado y lectura de bytes + metadatos;
- varios comprobantes por registro;
- reapertura con un `Blob` de prueba de 1 MiB en el entorno automatizado;
- rechazo de adjuntos huérfanos y de adjuntos nuevos sobre registros en Papelera;
- rollback de un lote completo cuando una escritura falla;
- Papelera/restauración, eliminación definitiva y purge por fecha;
- validación de `sizeBytes` contra el tamaño real del `Blob`;
- persistencia de un comprobante binario en Android WebView emulado después de cierre forzado y segundo arranque frío.

Con esta evidencia, **IndexedDB + Blob se mantiene como el adaptador inicial de v0.1**. Esto no significa que 1 MiB sea un límite de producto ni que IndexedDB tenga la misma cuota disponible en todos los dispositivos. Antes de una entrega real se medirán cuota, memoria y comportamiento con dispositivos/archivos representativos. Si aparece evidencia negativa, `AttachmentStore` permite sustituir el backend por OPFS en PWA y/o filesystem nativo en Android sin cambiar el dominio financiero.

La eliminación de un comprobante sigue la regla global de Cash-X: la capa de aplicación debe pedir confirmación antes de moverlo a Papelera y una segunda confirmación antes de una eliminación definitiva manual. El adaptador evita eliminar permanentemente un adjunto activo.

## Persistencia PWA y Android

La PWA solicitará almacenamiento persistente cuando sea posible, pero el almacenamiento local nunca sustituye un backup.

El APK/AAB reutiliza la misma aplicación mediante Capacitor. Ya están validados en CI la generación del proyecto Android, `cap sync`, el APK debug y la persistencia real de Dexie/IndexedDB tras un cierre forzado y reapertura dentro de Android WebView emulado, tanto para datos estructurados como para un comprobante `Blob`.

La validación actual corresponde a un emulador Android API 35; un dispositivo físico sigue pendiente antes de una entrega real.

La configuración de Capacitor se mantiene en `capacitor.config.json`. Se eligió JSON después de comprobar que el loader de `capacitor.config.ts` de Capacitor 8.5.2 no es compatible con TypeScript 7.0.2 bajo el Node 22.12 usado por el proyecto. El cambio evita flags experimentales y reduce acoplamiento de herramientas.

## Reproducibilidad de instalación

PR #25 versionó `package-lock.json` generado con Node 22.12.0 y cambió los jobs de CI a `npm ci`. Las versiones directas continúan fijadas en `package.json` y el lockfile fija el árbol transitivo exacto de esa revisión.

Regla operativa:

- cambios intencionales de dependencias deben actualizar `package.json` y `package-lock.json` juntos;
- CI usa `npm ci` y debe fallar si ambos archivos dejan de ser coherentes;
- no se actualizan dependencias oportunísticamente dentro de trabajo no relacionado.

## Backup externo con binarios

PR #27 cerró el hueco de transporte binario mediante un contenedor propio pequeño y versionado, sin añadir una dependencia ZIP.

El archivo `.cashx` v1 contiene:

- header `CASHX-BACKUP-V1`;
- longitud de manifiesto;
- SHA-256 del manifiesto;
- manifiesto JSON con datos estructurados y metadatos de comprobantes;
- comprobantes como bytes crudos contiguos;
- SHA-256 calculado sobre los bytes reales de cada comprobante;
- offsets, longitudes y tamaño total del payload.

Antes de restaurar se valida completamente el archivo, incluidos tipos, IDs únicos, referencias, tamaño total, offsets, hash de manifiesto y hashes de comprobantes. Solo después se entrega un `CashXBackupV1` válido a `LocalPersistence.restoreBackup`, que escribe dentro de una transacción Dexie.

La prueba automatizada crea una instalación origen, exporta un `.cashx`, restaura dos veces en una segunda base independiente y verifica que libros, categorías, registros y comprobantes quedan íntegros sin duplicados. También altera deliberadamente manifiesto y payload y prueba un truncamiento; los tres casos se rechazan antes de restaurar.

El archivo conserva elementos que aún están en Papelera para representar el estado completo de la instalación.

El formato detallado se mantiene en `docs/BACKUP.md`.

**Limitación de seguridad:** `.cashx` v1 aporta integridad, no cifrado. Debe tratarse como información financiera privada. Una futura versión puede añadir cifrado sin cambiar el modelo financiero ni el contrato de persistencia.

## Google Drive opcional

- Sin Drive, Cash-X funciona completamente local.
- Con Drive, cada dispositivo mantiene copia local y sincroniza mediante Google OAuth/Drive.
- Se prioriza `drive.appdata`; respaldos visibles creados por Cash-X pueden usar `drive.file`.
- No se solicita acceso amplio a todo el Drive.
- El contenedor `.cashx` es el objeto de transferencia/backup inicial que el adaptador Drive puede almacenar sin conocer detalles de Dexie.
- Sync debe ser idempotente, recuperable y conservar conflictos concurrentes en vez de sobrescribirlos.
- Desconectar Drive no borra datos locales.
- TeraBox queda como proveedor futuro solo mediante API oficial validada.

Contrato completo: `docs/SYNC.md`.

## Validaciones completadas

PR #14 validó en entorno automatizado con `fake-indexeddb`:

- abrir/cerrar/reabrir datos;
- rollback atómico ante error;
- Papelera/restauración;
- migración v1→v2;
- backup/restauración repetida sin duplicados;
- typecheck y build.

PR #17 validó en CI:

- generación del proyecto Android con Capacitor;
- sincronización de assets web;
- build Gradle `assembleDebug`;
- creación de APK debug como artefacto.

PR #20 validó en un emulador Android API 35:

- instalación y arranque del APK de prueba;
- escritura y lectura con los adaptadores reales;
- cierre forzado del proceso de la aplicación;
- segundo arranque frío;
- persistencia e integridad de datos estructurados en Dexie/IndexedDB.

PR #23 amplió esa evidencia a comprobantes binarios y validó `AttachmentStore`/`DexieAttachmentStore`, `Blob`, rollback de lote, Papelera/restauración, purge y persistencia de bytes en Android WebView.

PR #25 añadió `package-lock.json` y validó la instalación reproducible con `npm ci` sin romper typecheck, tests, build web ni el pipeline Android.

PR #27 validó el contenedor externo `.cashx`, restauración entre dos instalaciones de prueba, idempotencia y detección de corrupción/truncamiento, sin nuevas dependencias de producción.

## Dependencias del spike

Versiones directas fijadas tras revisión de mantenimiento/licencia/compatibilidad:

- Dexie 4.4.6 — Apache-2.0;
- Capacitor core/CLI/Android 8.5.2 — MIT;
- Vite 8.3.0 — MIT;
- TypeScript 7.0.2;
- Vitest 5.0.1 — MIT;
- fake-indexeddb 6.2.5 — Apache-2.0, solo pruebas.

El árbol transitivo queda fijado por `package-lock.json` y CI usa `npm ci`.

El formato `.cashx` no introduce una dependencia adicional de producción.

## Validaciones restantes de Checkpoint 3

- Google OAuth/Drive con permisos mínimos;
- transporte de `.cashx` mediante `appDataFolder`;
- dos instalaciones offline/reconexión;
- conflicto concurrente sin pérdida silenciosa;
- desconexión/reconexión Drive;
- límites/cuotas y fallos agresivos de almacenamiento en dispositivo;
- prueba física Android antes de entrega real.

## Regla de arquitectura

`UI -> casos de uso -> contratos de repositorio -> Dexie/IndexedDB`

`                               -> AttachmentStore -> Dexie/Blob | futuro OPFS/filesystem`

`                               -> BackupFileService -> .cashx`

`                               -> SyncEngine -> CloudSyncProvider -> Google Drive`

Capacitor, APIs de navegador, OAuth y proveedores cloud pertenecen a adaptadores de plataforma, no al dominio.
