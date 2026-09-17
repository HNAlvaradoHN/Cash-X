# Estado del proyecto

**Fecha:** 2026-09-17  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`.
- Visibilidad: pública.
- Rama principal: `main`.
- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- Checkpoint 1 y Checkpoint 2: completados.
- Checkpoint 3: en progreso.
- PRs técnicos integrados hasta este tramo: #14, #15, #17, #18, #20, #21, #23, #25, #27, #29, #31, #33, #35, #37, #39; PR #41 se integra al cerrar este tramo.
- Issues de Checkpoint 3 cerrados por sus PR correspondientes: #19, #22, #24, #26, #28, #30, #32, #34, #36, #38; #40 se cierra con PR #41.
- Issues #12 y #13 fueron creados accidentalmente por tooling y están cerrados como `not_planned`.

## Estado funcional

El contrato funcional está definido en `docs/PRODUCT_SPEC.md`, el modelo técnico en `docs/DOMAIN_MODEL.md`, persistencia/plataforma en `docs/PERSISTENCE.md`, backup externo en `docs/BACKUP.md`, sincronización opcional en `docs/SYNC.md` y transporte Drive en `docs/DRIVE.md`.

Continúan aprobadas las reglas de libros independientes, ingreso/egreso, categorías configurables, campo adicional opcional, dinero exacto, cálculo automático, Papelera 30 días, comprobantes opcionales, reportes posteriores, modo local completo y Google Drive opcional sin backend propio.

## Checkpoint 3 — Persistencia local, dominio y sincronización

**Estado: en progreso.**

### Persistencia local y Android

Dexie/IndexedDB está detrás de contratos internos y validado con reapertura, rollback, migración, Papelera/restauración e importación idempotente. CI genera el proyecto Android temporalmente, compila APK debug y valida en Android API 35 emulado que los datos sobreviven `force-stop` y segundo arranque frío.

### Comprobantes binarios

PR #23 añadió `AttachmentStore`/`DexieAttachmentStore`. Se validó almacenamiento y lectura de `Blob`, reapertura conservando un `Blob` de 1 MiB, varios comprobantes, rechazo de huérfanos, rollback de lote, Papelera/restauración, purge, validación de tamaño y persistencia binaria dentro de Android WebView emulado.

`Blob` en IndexedDB sigue siendo el primer adaptador de v0.1. Todavía no existe un tamaño máximo de producto validado ni prueba de cuota/memoria en dispositivo físico.

### Dependencias reproducibles

PR #25 versionó `package-lock.json` con Node 22.12.0 y migró CI a `npm ci`.

### Backup externo

PR #27 implementó `.cashx` v1 con header versionado, manifiesto JSON, bytes binarios crudos y SHA-256. Se validó source → archivo → segunda base Dexie, restauración repetida idempotente y rechazo de manifiesto/payload corrupto o archivo truncado.

El formato v1 protege integridad, no confidencialidad; todavía no está cifrado.

### Transporte Google Drive

PR #29 implementó `CloudAuthorizationProvider`, `CloudSyncProvider`, `GoogleDriveHttpClient`, `GoogleDriveCloudSyncProvider` y `GoogleDriveVisibleFileStore`.

Las pruebas HTTP simuladas validan:

- objetos internos exclusivamente en `appDataFolder`;
- identidad estable mediante `appProperties`;
- create/read/update sin duplicados silenciosos;
- rechazo de identidades remotas ambiguas;
- reintentos acotados, `Retry-After`, timeout y cancelación;
- archivos visibles automáticos únicamente bajo `Mi unidad/Cash-X/Backups` o `Mi unidad/Cash-X/Exportaciones`.

OAuth real sigue pendiente; no hay client secrets, access tokens ni cuentas reales en Git.

### Conflictos y recuperación offline

PRs #31, #33, #35, #37 y #39 implementaron y validaron:

- operaciones versionadas y deduplicación determinista;
- conflictos explícitos cuando dos dispositivos editan el mismo objeto desde la misma versión base;
- oplog y conflictos persistentes en Dexie;
- cola offline persistente con confirmación parcial y retry/backoff;
- cursor remoto persistente y pull transaccional;
- replay idempotente y rechazo de páginas fuera de orden;
- rollback de operaciones + cursor ante colisión;
- dos instalaciones simuladas que trabajan offline, reinician, intercambian cambios y convergen al mismo oplog sin pérdida silenciosa.

### Motor cloud sobre `CloudSyncProvider`

PR #41 conecta el motor ya validado con el contrato cloud mediante `CloudSyncEngine`.

El protocolo actual usa un snapshot versionado por dispositivo bajo una identidad estable `oplog:<deviceId>`. Cada snapshot contiene únicamente operaciones originadas por ese dispositivo. Antes de sobrescribir su snapshot, Cash-X descarga la copia remota existente y fusiona de forma monotónica; una reinstalación local incompleta no puede borrar silenciosamente operaciones remotas previas del mismo `deviceId`.

La cola se confirma únicamente después de un `put` cloud exitoso. El pull descarga snapshots de otros dispositivos, valida formato/identidades, calcula SHA-256 del contenido como cursor y aplica mediante `RemoteSyncPull`. Repetir el mismo snapshot es idempotente. Contenido malformado o una colisión de identidad no avanza el cursor ni deja operaciones parciales.

Las pruebas de PR #41 usan dos bases Dexie independientes y un `CloudSyncProvider` compartido en memoria para demostrar publicación, reinstalación-like reset sin regresión remota, convergencia, conflicto preservado, replay y rollback. Este bloque prueba el protocolo detrás del mismo contrato que usa Google Drive, pero **no sustituye OAuth/Drive reales**.

## OAuth: restricción actual verificada

La arquitectura mantiene la decisión de no introducir backend propio. La guía vigente de Google para web recomienda el modelo de código de autorización por su mayor seguridad, pero ese modelo requiere una plataforma backend para intercambio/almacenamiento de tokens. El modelo puramente navegador puede obtener access tokens con Google Identity Services mientras el usuario está presente, pero Google lo considera de menor seguridad que el modelo de código.

Por seguridad, Cash-X no va a fingir que ambas restricciones son equivalentes. La primera validación real de Drive debe priorizar Android mediante la API nativa `AuthorizationClient` de Google Play services, que puede entregar un access token para scopes concedidos sin pedir acceso offline de servidor. La estrategia PWA final debe quedar aprobada explícitamente antes de release si se mantiene el requisito de cero backend.

## Pendiente de Checkpoint 3

- configurar en Google Cloud un cliente OAuth Android de prueba para `com.cashx.app` con la firma de prueba correspondiente, fuera del repositorio;
- integrar/validar autorización Android con scope mínimo `drive.appdata` y ejecutar el primer E2E real sobre `appDataFolder`;
- probar dos instalaciones reales con la misma cuenta: push/pull, offline/reconexión, replay y conflicto concurrente;
- decidir explícitamente el modelo OAuth PWA compatible con el requisito de seguridad y cero backend; no adoptar silenciosamente un flujo web menos seguro;
- incorporar comprobantes binarios al sync vivo remoto o definir su estrategia remota definitiva con hash/cleanup;
- validar desconexión/reconexión de Drive sin pérdida local;
- probar límites/cuotas y fallos agresivos de red/almacenamiento;
- prueba física Android antes de una entrega real;
- diseñar UX de resolución de conflictos antes de exponer sincronización multi-dispositivo al usuario.

## CI

CI instala con `npm ci` y valida typecheck, tests, build web, generación/build Android debug y persistencia Dexie/IndexedDB —incluidos comprobantes `Blob`— después de cierre forzado/reapertura en emulador Android API 35.

Las pruebas `verify` cubren además `.cashx`, transporte Drive simulado, núcleo de conflictos, oplog/conflictos persistentes, cola offline, cursor remoto, recuperación entre reinicios y `CloudSyncEngine` sobre `CloudSyncProvider`.

## Trabajo paralelo

No hay trabajo paralelo identificado al cerrar PR #41.

## Siguiente paso exacto

**Preparar la autorización Android nativa de Google Drive detrás de `CloudAuthorizationProvider` usando `AuthorizationClient` y `drive.appdata`, sin pedir offline server access ni guardar secretos. Después configurar el cliente OAuth Android de prueba fuera del repositorio y ejecutar el primer E2E real `Android A -> appDataFolder -> Android B`. No construir dashboard todavía.**
