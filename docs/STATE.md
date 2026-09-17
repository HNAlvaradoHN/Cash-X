# Estado del proyecto

**Fecha:** 2026-09-16  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`.
- Visibilidad: pública.
- Rama principal: `main`.
- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- PR #14 `spike(persistence): validate local Dexie foundation`: integrado.
- PR #15 `docs(state): close local persistence spike`: integrado.
- PR #17 `ci(android): validate generated Capacitor build`: integrado.
- PR #18 `docs(state): close Android build spike`: integrado.
- PR #20 `test(android): validate WebView IndexedDB persistence`: integrado.
- PR #21 `docs(state): record Android WebView persistence validation`: integrado.
- PR #23 `feat(attachments): validate local Blob storage and cleanup`: integrado.
- PR #25 `chore(ci): make dependency installation reproducible`: integrado.
- PR #27 `feat(backup): validate external binary backup format`: integrado.
- PR #29 `feat(sync): add ordered Google Drive transport`: integrado al cerrar este tramo.
- Issue #19 `Checkpoint 3 spike: validate IndexedDB persistence in Android WebView`: cerrado como completado.
- Issue #22 `Checkpoint 3 spike: validate attachment Blob storage and cleanup`: cerrado como completado por PR #23.
- Issue #24 `Checkpoint 3: make dependency installation reproducible`: cerrado como completado por PR #25.
- Issue #26 `Checkpoint 3: validate external backup with binary attachments`: cerrado como completado por PR #27.
- Issue #28 `Checkpoint 3: implement Google Drive transport behind CloudSyncProvider`: cerrado como completado por PR #29.
- Issues #12 y #13 fueron creados accidentalmente por tooling y están cerrados como `not_planned`; no contienen trabajo de proyecto.

## Estado funcional

El contrato funcional está definido en `docs/PRODUCT_SPEC.md`, el modelo técnico en `docs/DOMAIN_MODEL.md`, persistencia/plataforma en `docs/PERSISTENCE.md`, backup externo en `docs/BACKUP.md`, sincronización opcional en `docs/SYNC.md` y transporte Drive en `docs/DRIVE.md`.

Continúan aprobadas las reglas de libros independientes, ingreso/egreso, categorías configurables, campo adicional opcional, dinero exacto, cálculo automático, Papelera 30 días, comprobantes opcionales, reportes detallados posteriores, modo local completo y Google Drive opcional sin backend propio.

## Checkpoint 3 — Persistencia local, dominio y sincronización

**Estado: en progreso.**

### Modelo de dominio

**Formalización lógica completada.**

### Persistencia local estructurada

**Completada e integrada.**

PR #14 añadió scaffold TypeScript + Vite, Dexie/IndexedDB, migración de esquema, Papelera/restauración, backup/restauración idempotente a nivel de objetos y CI. Sus pruebas cubren reapertura, rollback atómico, Papelera/restauración, migración y restauración repetida sin duplicados.

### Android — build y persistencia WebView

**Build debug y persistencia Dexie/IndexedDB validados en CI con Android emulado.**

PR #17 validó generación temporal de `android/`, `cap sync`, Gradle `assembleDebug` y creación de APK debug.

PR #20 añadió un probe técnico aislado que usa las implementaciones reales `CashXDatabase` y `LocalPersistence`. En un emulador Android API 35 el CI escribe datos, fuerza el cierre de `com.cashx.app`, abre nuevamente la aplicación y comprueba la integridad de los datos persistidos.

### Comprobantes binarios

**Primer adaptador local validado.**

PR #23 añadió el contrato `AttachmentStore` y el adaptador `DexieAttachmentStore`. Las pruebas demuestran:

- almacenamiento y lectura de `Blob` con metadatos;
- cierre/reapertura de IndexedDB conservando un `Blob` de prueba de 1 MiB y sus bytes extremos;
- varios comprobantes por registro y orden estable;
- rechazo de comprobantes huérfanos o asociados a un registro en Papelera;
- rollback completo de un lote cuando IndexedDB rechaza una escritura;
- Papelera, restauración, eliminación definitiva protegida y purge por fecha;
- rechazo de metadatos de tamaño que no coinciden con los bytes reales;
- persistencia de un comprobante binario real dentro de Android WebView emulado después de `force-stop` y segundo arranque frío.

Esto es evidencia suficiente para mantener `Blob` en IndexedDB como primer adaptador de v0.1. **No fija todavía un tamaño máximo de producto ni sustituye pruebas de cuota/memoria en dispositivos físicos.** Si evidencia posterior lo exige, `AttachmentStore` permite mover binarios a OPFS o filesystem nativo sin tocar el dominio financiero.

### Reproducibilidad de dependencias

**Completada para el entorno actual.**

PR #25 versionó `package-lock.json` generado con Node 22.12.0 y cambió los jobs normales de CI a `npm ci`. El lockfile fija también el árbol transitivo, por lo que la misma revisión ya no depende de resolver versiones compatibles diferentes en cada ejecución.

### Backup externo entre instalaciones

**Formato v1 implementado y validado.**

PR #27 añadió un archivo único `.cashx` con header versionado, manifiesto JSON y comprobantes como bytes binarios crudos. La importación valida SHA-256 del manifiesto, SHA-256 calculado sobre cada comprobante, tamaños, offsets, tipos, IDs únicos y referencias antes de escribir en IndexedDB.

Las pruebas crean una instalación origen con libro, categoría, registro y dos comprobantes —incluido uno en Papelera—, exportan el archivo, lo restauran dos veces en una segunda base Dexie y comprueban integridad de los bytes sin duplicados. También se rechazan manifiesto modificado, payload binario modificado y archivo truncado.

El formato está documentado en `docs/BACKUP.md`. El backup v1 no está cifrado; esa limitación debe comunicarse cuando exista UI de exportación.

### Transporte Google Drive

**Adaptador REST implementado y validado contra HTTP simulado; OAuth real pendiente.**

PR #29 añadió `CloudAuthorizationProvider`, `CloudSyncProvider`, `GoogleDriveHttpClient`, `GoogleDriveCloudSyncProvider` y `GoogleDriveVisibleFileStore` sin nuevas dependencias de producción.

Las pruebas automatizadas demuestran:

- objetos internos creados exclusivamente bajo `appDataFolder`;
- búsqueda por identidad estable en `appProperties` y actualización del mismo archivo sin duplicarlo;
- descarga de bytes;
- rechazo de identidades remotas duplicadas/ambiguas para evitar sobrescritura silenciosa;
- timeout/cancelación preparados y reintentos acotados para errores transitorios/rate limit;
- jerarquía visible administrada `Mi unidad/Cash-X/Backups` y `Mi unidad/Cash-X/Exportaciones`;
- reutilización de la misma jerarquía en operaciones posteriores, sin crear archivos visibles sueltos en la raíz.

La autorización está deliberadamente separada del transporte. No existen client secrets, tokens ni cuentas Google reales en Git. La prueba real requiere configurar OAuth client IDs de prueba para PWA y Android fuera del repositorio. Hasta entonces, Drive está **implementado, pendiente de validación E2E real**.

## Pendiente de Checkpoint 3

- configurar OAuth de prueba para PWA y Android/Capacitor fuera del repositorio y validar autorización real;
- probar dos instalaciones con la misma cuenta Google, offline/reconexión, reintentos e idempotencia;
- implementar y provocar conflictos concurrentes sin pérdida silenciosa;
- validar desconexión/reconexión de Drive sin perder datos locales;
- probar recuperación ante fallos más agresivos y límites/cuotas reales en dispositivo;
- realizar prueba física Android antes de considerar una entrega real.

## CI

Cash-X tiene CI propio. `main` instala dependencias con `npm ci` y valida typecheck, tests, build web, generación/build Android debug y persistencia real de Dexie/IndexedDB —incluidos comprobantes `Blob`— tras cierre forzado y reapertura en un emulador Android API 35.

Las pruebas de `verify` cubren además el contenedor externo `.cashx`, restauración entre dos bases independientes, idempotencia, detección de corrupción/truncamiento y el transporte Drive simulado con aislamiento de `appDataFolder`, actualización idempotente, reintentos y jerarquía visible ordenada.

## Trabajo paralelo

No hay trabajo paralelo identificado después de integrar PR #29.

## Siguiente paso exacto

**Materializar la autorización Google de prueba fuera del repositorio y ejecutar el primer E2E real: una instalación autoriza Drive, sube un `.cashx`/objeto de sincronización en `appDataFolder` y una segunda instalación con la misma cuenta lo recupera sin backend propio. Después validar offline/reconexión y conflictos. No construir dashboard todavía.**
