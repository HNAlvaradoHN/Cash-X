# Persistencia y plataforma de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** persistencia local, build Android y reapertura en Android WebView validados; comprobantes/Drive pendientes

## Objetivo

Mantener una sola base de código para PWA y Android, priorizando integridad de datos, simplicidad, mantenimiento y operación offline.

## Decisión v0.1

- TypeScript + Vite como base.
- PWA offline-first.
- Android mediante Capacitor, sin reescribir dominio/UI en Kotlin.
- IndexedDB mediante Dexie para datos estructurados locales tanto en PWA como dentro de Android WebView.
- Acceso únicamente mediante contratos de persistencia; UI no toca Dexie directamente.
- Comprobantes detrás de `AttachmentStore`.
- Google Drive opcional detrás de `CloudSyncProvider`; sin backend propio de Cash-X.
- SQLite queda como alternativa futura solo si evidencia real justifica migrar.

## Datos estructurados

El adaptador Dexie cubre libros, ingresos/egresos, categorías, campo adicional, Papelera, metadatos de comprobantes, configuración y versiones de esquema. Operaciones relacionadas que deban ser atómicas usan transacciones.

## Comprobantes

El primer adaptador puede almacenar `Blob` en IndexedDB separado de las tablas lógicas. Antes de release se probarán tamaño, memoria, lectura, eliminación y cleanup. Si los binarios grandes no son adecuados, `AttachmentStore` podrá usar OPFS en PWA y filesystem nativo en Android sin tocar el dominio.

## Persistencia PWA y Android

La PWA solicitará almacenamiento persistente cuando sea posible, pero el almacenamiento local nunca sustituye un backup.

El APK/AAB reutiliza la misma aplicación mediante Capacitor. Ya están validados en CI la generación del proyecto Android, `cap sync`, el APK debug y la persistencia real de Dexie/IndexedDB tras un cierre forzado y reapertura dentro de Android WebView emulado.

La prueba de runtime usa un probe técnico separado de la UI normal. El primer arranque crea y relee un libro mediante `CashXDatabase` + `LocalPersistence`; después CI fuerza el cierre de la aplicación y, en un segundo arranque frío, comprueba que el mismo libro conserva sus datos. La validación actual corresponde a un emulador Android API 35; un dispositivo físico sigue pendiente antes de una entrega real.

La configuración de Capacitor se mantiene en `capacitor.config.json`. Se eligió JSON después de comprobar que el loader de `capacitor.config.ts` de Capacitor 8.5.2 no es compatible con TypeScript 7.0.2 bajo el Node 22.12 usado por el proyecto. El cambio evita flags experimentales y reduce acoplamiento de herramientas.

## Google Drive opcional

- Sin Drive, Cash-X funciona completamente local.
- Con Drive, cada dispositivo mantiene copia local y sincroniza mediante Google OAuth/Drive.
- Se prioriza `drive.appdata`; respaldos visibles creados por Cash-X pueden usar `drive.file`.
- No se solicita acceso amplio a todo el Drive.
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
- persistencia e integridad del libro almacenado en Dexie/IndexedDB.

## Dependencias del spike

Versiones directas fijadas tras revisión de mantenimiento/licencia/compatibilidad:

- Dexie 4.4.6 — Apache-2.0;
- Capacitor core/CLI/Android 8.5.2 — MIT;
- Vite 8.3.0 — MIT;
- TypeScript 7.0.2;
- Vitest 5.0.1 — MIT;
- fake-indexeddb 6.2.5 — Apache-2.0, solo pruebas.

Falta `package-lock.json`; se considera pendiente de reproducibilidad antes de release.

## Validaciones restantes de Checkpoint 3

- comprobantes binarios, límites, lectura, eliminación y cleanup;
- recuperación ante fallos más agresivos de escritura/migración;
- backup entre instalaciones reales/de prueba;
- `package-lock.json` e instalación reproducible;
- Google OAuth/Drive;
- dos instalaciones offline/reconexión;
- conflicto concurrente sin pérdida silenciosa;
- desconexión/reconexión Drive;
- prueba física Android antes de entrega real.

## Regla de arquitectura

`UI -> casos de uso -> contratos de repositorio -> Dexie/IndexedDB`

`                                 -> SyncEngine -> CloudSyncProvider -> Google Drive`

Capacitor, APIs de navegador, OAuth y proveedores cloud pertenecen a adaptadores de plataforma, no al dominio.
