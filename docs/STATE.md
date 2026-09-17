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
- PRs técnicos integrados hasta este tramo: #14, #15, #17, #18, #20, #21, #23, #25, #27, #29, #31, #33, #35, #37, #39, #41; PR #43 se integra al cerrar este tramo.
- Issues de Checkpoint 3 cerrados por sus PR correspondientes: #19, #22, #24, #26, #28, #30, #32, #34, #36, #38, #40; #42 se cierra con PR #43.
- Issues #12 y #13 fueron creados accidentalmente por tooling y están cerrados como `not_planned`.

## Estado funcional

El contrato funcional está definido en `docs/PRODUCT_SPEC.md`, el modelo técnico en `docs/DOMAIN_MODEL.md`, persistencia/plataforma en `docs/PERSISTENCE.md`, backup externo en `docs/BACKUP.md`, sincronización opcional en `docs/SYNC.md`, transporte Drive en `docs/DRIVE.md` y la evidencia de autorización Android en `docs/ANDROID_AUTH.md`.

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

Las pruebas HTTP simuladas validan objetos internos exclusivamente en `appDataFolder`, identidad estable mediante `appProperties`, create/read/update sin duplicados silenciosos, rechazo de identidades ambiguas, reintentos acotados, `Retry-After`, timeout/cancelación y archivos visibles automáticos únicamente bajo `Mi unidad/Cash-X/Backups|Exportaciones`.

OAuth real sigue pendiente; no hay client secrets, access tokens ni cuentas reales en Git.

### Conflictos y recuperación offline

PRs #31, #33, #35, #37 y #39 implementaron operaciones versionadas, conflictos explícitos, oplog/conflictos persistentes, cola offline con retry, cursor remoto transaccional, replay idempotente, rollback ante colisión y convergencia simulada entre dos instalaciones después de reinicios.

### Motor cloud sobre `CloudSyncProvider`

PR #41 conecta el motor con el contrato cloud mediante `CloudSyncEngine`.

Cada dispositivo publica un snapshot versionado bajo `oplog:<deviceId>`. Antes de sobrescribirlo, Cash-X descarga y fusiona la copia remota previa de forma monotónica para no perder operaciones de una instalación anterior. La cola se confirma solo después de `put` exitoso. El pull valida snapshots, usa SHA-256 como cursor y aplica con `RemoteSyncPull`; replay, contenido malformado y colisiones están cubiertos por pruebas.

### Autorización Google en Android — dependencia

**Spike de compilación validado; autorización real todavía pendiente.**

PR #43 probó temporalmente `com.google.android.gms:play-services-auth:22.0.0` contra el Android generado por Capacitor, JDK 21 y Gradle 8.14.3. Una clase mínima con `AuthorizationClient`, `AuthorizationRequest` y `Scopes.DRIVE_APPFOLDER` compiló correctamente sin `requestOfflineAccess`, client IDs, secretos, tokens ni cuenta real.

La inyección ocurrió después de subir el APK normal y se retiró antes del persistence probe. El APK normal no incorpora todavía la dependencia. El run de evidencia `35224732148` quedó verde de extremo a extremo, incluido el probe Android existente.

Medición debug orientativa:

- APK normal: 4,118,190 bytes (3.93 MiB);
- APK temporal con `play-services-auth`: 7,788,698 bytes (7.43 MiB);
- delta: 3,670,508 bytes (~3.50 MiB, +89.1%).

Este delta no representa release/AAB final y debe medirse nuevamente si se adopta el bridge. La dependencia es técnicamente compatible para continuar el prototipo, pero no se adopta todavía como dependencia permanente. Evidencia y evaluación: `docs/ANDROID_AUTH.md`.

## OAuth: restricción actual verificada

Cash-X mantiene la decisión de no introducir backend propio. Para web, Google recomienda el modelo de código de autorización por mayor seguridad, pero ese modelo necesita una plataforma backend para el intercambio/almacenamiento de tokens. No se almacenarán refresh tokens en JavaScript ni se incrustará un `client_secret` en la PWA; la estrategia web final requiere decisión explícita antes de release.

Android puede continuar con `AuthorizationClient` y `drive.appdata` sin solicitar acceso offline de servidor. El access token deberá quedar detrás de `CloudAuthorizationProvider` y tratarse como credencial efímera.

## Pendiente de Checkpoint 3

- implementar un bridge Android pequeño detrás de `CloudAuthorizationProvider` sin acoplar dominio/sync a Google Play services;
- configurar en Google Cloud un cliente OAuth Android de prueba para `com.cashx.app` y la firma de prueba, fuera del repositorio;
- validar consentimiento/access token real con `drive.appdata` y ejecutar `Android A -> appDataFolder -> Android B`;
- repetir push/pull real, offline/reconexión, retry/replay y conflicto concurrente;
- decidir explícitamente el modelo OAuth PWA compatible con seguridad y cero backend;
- incorporar comprobantes binarios al sync vivo remoto con hash/cleanup y recuperación de fallos parciales;
- validar desconexión/reconexión de Drive sin pérdida local;
- probar límites/cuotas y fallos agresivos de red/almacenamiento;
- prueba física Android antes de una entrega real;
- diseñar UX de resolución de conflictos antes de exponer sincronización multi-dispositivo.

## CI

CI instala con `npm ci` y valida typecheck, tests, build web, generación/build Android debug y persistencia Dexie/IndexedDB —incluidos comprobantes `Blob`— después de cierre forzado/reapertura en emulador Android API 35.

El spike de PR #43 añadió una ejecución temporal de compilación Google después de subir el APK normal, registró su evidencia y luego retiró el código/inyección temporal. El CI final del PR debe volver a ser el pipeline normal antes de merge.

## Trabajo paralelo

No hay trabajo paralelo identificado al cerrar PR #43.

## Siguiente paso exacto

**Implementar y validar un bridge Android mínimo para `AuthorizationClient` detrás de `CloudAuthorizationProvider`, encapsulando `play-services-auth` en la capa de plataforma. Después configurar el cliente OAuth Android de prueba fuera de Git y ejecutar el primer E2E real `Android A -> appDataFolder -> Android B`. No construir dashboard todavía.**
