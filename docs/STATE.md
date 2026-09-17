# Estado del proyecto

**Fecha:** 2026-09-17  
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
- PR #29 `feat(sync): add ordered Google Drive transport`: integrado.
- PR #31 `feat(sync): validate deterministic conflict core`: integrado.
- PR #33 `feat(sync): persist operation log and conflict state`: integrado.
- PR #35 `feat(sync): add persistent offline replay queue`: integrado.
- PR #37 `feat(sync): persist remote pull cursor`: integrado.
- PR #39 `test(sync): validate restart recovery invariants`: integrado al cerrar este tramo.
- Issues #19, #22, #24, #26, #28, #30, #32, #34, #36 y #38: cerrados como completados por sus PR correspondientes.
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

PR #17 validó generación temporal de `android/`, `cap sync`, Gradle `assembleDebug` y creación de APK debug. PR #20 añadió un probe técnico aislado que usa las implementaciones reales `CashXDatabase` y `LocalPersistence`; Android API 35 emulado escribe datos, fuerza cierre y confirma integridad tras el segundo arranque frío.

### Comprobantes binarios

**Primer adaptador local validado.**

PR #23 añadió `AttachmentStore` y `DexieAttachmentStore`. Las pruebas demuestran almacenamiento/lectura de `Blob`, reapertura conservando un `Blob` de 1 MiB, varios comprobantes por registro, rechazo de huérfanos, rollback de lote, Papelera/restauración, purge, validación de tamaño y persistencia binaria dentro de Android WebView emulado después de `force-stop`.

Esto permite mantener `Blob` en IndexedDB como primer adaptador de v0.1. No fija todavía un tamaño máximo de producto ni sustituye pruebas de cuota/memoria en dispositivos físicos.

### Reproducibilidad de dependencias

**Completada para el entorno actual.**

PR #25 versionó `package-lock.json` generado con Node 22.12.0 y cambió CI a `npm ci`.

### Backup externo entre instalaciones

**Formato v1 implementado y validado.**

PR #27 añadió un archivo único `.cashx` con header versionado, manifiesto JSON y comprobantes binarios crudos. La importación valida SHA-256 del manifiesto y comprobantes, tamaños, offsets, tipos, IDs y referencias antes de escribir. La prueba source→archivo→segunda base Dexie confirma restauración repetida idempotente y rechazo de manifiesto/payload corrupto o truncado.

El backup v1 no está cifrado; esa limitación debe comunicarse cuando exista UI de exportación.

### Transporte Google Drive

**Adaptador REST implementado y validado contra HTTP simulado; OAuth real pendiente.**

PR #29 añadió `CloudAuthorizationProvider`, `CloudSyncProvider`, `GoogleDriveHttpClient`, `GoogleDriveCloudSyncProvider` y `GoogleDriveVisibleFileStore` sin nuevas dependencias de producción.

Las pruebas demuestran objetos internos solo en `appDataFolder`, identidad estable con `appProperties`, actualización sin duplicados, descarga, rechazo de duplicados ambiguos, reintentos acotados, timeout/cancelación preparados y jerarquía visible administrada `Mi unidad/Cash-X/Backups|Exportaciones` sin archivos automáticos dispersos en la raíz.

### Núcleo de conflictos y recuperación offline

**Implementado y validado de forma simulada entre dos instalaciones; Drive/OAuth reales todavía pendientes.**

- PR #31 añadió operaciones versionadas, deduplicación determinista y conflictos explícitos para ediciones concurrentes del mismo objeto desde la misma versión base. Delete/restore usan el mismo modelo y una colisión de `operationId` con contenido distinto se rechaza.
- PR #33 persistió oplog y conflictos en Dexie. La ingestión es transaccional, idempotente y sobrevive cierre/reapertura.
- PR #35 añadió `syncQueue` persistente: enqueue idempotente, orden determinista, confirmación parcial, retry/backoff inyectable y reapertura sin perder operaciones pendientes.
- PR #37 añadió `remoteSyncCursors` y `RemoteSyncPull`: el cursor solo avanza después de aplicar la página completa, un replay ya confirmado es idempotente, páginas fuera de orden se rechazan y una colisión revierte operaciones y cursor.
- PR #39 integra estos componentes en pruebas de recuperación: confirmaciones parciales/retry sobreviven reinicio; dos bases independientes trabajan offline, hacen push/pull simulado, reinician y convergen al mismo oplog; una edición concurrente queda visible como conflicto en ambos lados; repetir el pull no duplica; una página defectuosa no deja avance falso ni operaciones parciales.

Esta evidencia cierra el riesgo lógico principal de pérdida silenciosa en el motor local/simulado. **No equivale todavía a una prueba E2E con Google Drive real ni a resolución de conflictos por UI.**

## Pendiente de Checkpoint 3

- configurar OAuth de prueba para PWA y Android/Capacitor fuera del repositorio y validar autorización real con scopes mínimos;
- ejecutar el primer E2E real con la misma cuenta Google: dispositivo A sube a `appDataFolder`, dispositivo B recupera y confirma integridad/idempotencia;
- repetir offline/reconexión, reintentos y conflicto concurrente contra Drive real;
- validar desconexión/reconexión de Drive sin perder datos locales;
- probar límites/cuotas y fallos más agresivos de almacenamiento/red en dispositivo;
- realizar prueba física Android antes de considerar una entrega real;
- diseñar posteriormente UX explícita de resolución de conflictos, sin sobrescritura silenciosa.

## CI

Cash-X tiene CI propio. `main` instala dependencias con `npm ci` y valida typecheck, tests, build web, generación/build Android debug y persistencia real de Dexie/IndexedDB —incluidos comprobantes `Blob`— tras cierre forzado y reapertura en un emulador Android API 35.

Las pruebas de `verify` cubren además `.cashx`, restauración entre dos bases, integridad/corrupción, transporte Drive simulado, núcleo de conflictos, oplog/conflictos persistentes, cola offline, cursor remoto y recuperación/convergencia simulada entre dos instalaciones después de reinicios y replays.

## Trabajo paralelo

No hay trabajo paralelo identificado después de integrar PR #39.

## Siguiente paso exacto

**Materializar la autorización Google de prueba fuera del repositorio y ejecutar el primer E2E real: una instalación autoriza Drive, publica datos/objeto de sincronización en `appDataFolder`, una segunda instalación con la misma cuenta los recupera, y luego se repiten offline/reconexión, replay e incompatibilidad concurrente sobre el transporte real. No construir dashboard todavía.**
