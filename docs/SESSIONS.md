# Sesiones de trabajo de Cash-X

Este archivo define la numeración oficial de chats de trabajo. No usar memoria de ChatGPT para inferir números.

## Formato de encabezado

`Ing. Cash-X #N 💵`

## Registro

### Cash-X #1

- Fecha de inicio: 2026-09-16.
- Motivo: inicio formal de Cash-X sobre el repositorio renombrado.
- Verificación inicial: completada antes de modificar.
- Checkpoint 1: base limpia del repositorio, completado.
- Checkpoint 2: contrato funcional mínimo, completado.
- Checkpoint 3: persistencia local, dominio y sincronización opcional, en progreso.

#### Decisiones de producto vigentes

- La UI principal usa `+ Ingreso` y `− Egreso`.
- Libros: nombre y moneda obligatorios; saldo inicial, icono y color opcionales; activo/archivado.
- Formulario: monto, descripción, categoría y fecha obligatorios; nota, referencia/persona y comprobantes bajo `Más detalles`.
- Monto puede usar calculadora simple; se guarda resultado exacto, sin coma flotante como fuente de verdad.
- Campo adicional opcional por libro.
- Saldo siempre derivado y recalculado automáticamente.
- Acciones destructivas iniciadas por usuario requieren confirmación.
- Papelera: 30 días, restauración, eliminación definitiva explícita.
- Categorías/opciones usadas históricamente se retiran de selección sin romper historial.
- Reportes posteriores: un libro, rangos semana/mes/año/personalizado, detalle y saldo acumulado.
- UI final sigue pospuesta hasta cerrar los riesgos principales de persistencia/sincronización.

#### Arquitectura y persistencia vigentes

- TypeScript + Vite, PWA + Capacitor Android.
- Dexie/IndexedDB detrás de contratos; UI no accede directamente a Dexie.
- Sin backend propio obligatorio, Supabase, Firebase ni Cloudflare.
- Google Drive es proveedor cloud opcional inicial.
- Sin Drive, Cash-X funciona localmente.
- Datos internos de sync viven en `appDataFolder`.
- Archivos visibles automáticos solo bajo `Mi unidad/Cash-X/Backups` o `Mi unidad/Cash-X/Exportaciones`.
- `AttachmentStore` desacopla comprobantes del almacenamiento concreto.
- Backup externo `.cashx` v1: manifiesto + bytes binarios + SHA-256; no cifrado.
- No existe overwrite silencioso para conflictos: dos ediciones incompatibles se conservan como conflicto explícito.
- Estado de sync recuperable: oplog/conflictos, cola offline y cursor remoto persistentes.
- `CloudSyncEngine` usa snapshots versionados por dispositivo detrás de `CloudSyncProvider`, con publicación monotónica y cursor SHA-256.

#### Validaciones técnicas completadas en Checkpoint 3

- PR #14: base Dexie/IndexedDB, migración, Papelera/restauración, backup lógico y CI.
- PR #17: generación Capacitor y APK debug en CI.
- PR #20: persistencia Dexie/IndexedDB tras `force-stop` y segundo arranque frío en Android API 35 emulado.
- PR #23: `AttachmentStore`/`DexieAttachmentStore`, varios `Blob`, rollback, Papelera/restauración, purge y persistencia binaria Android emulada.
- PR #25: `package-lock.json` y `npm ci`.
- PR #27: `.cashx` v1 con SHA-256, restore entre dos instalaciones, idempotencia y rechazo de corrupción/truncamiento.
- PR #29: transporte Drive REST con `appDataFolder`, `appProperties`, retries, timeout/cancelación y jerarquía visible ordenada.
- PR #31: núcleo determinista de operaciones/versiones/conflictos.
- PR #33: oplog/conflictos persistentes y transaccionales.
- PR #35: cola offline persistente con confirmación parcial y retry/backoff.
- PR #37: cursor remoto persistente y pull transaccional con replay/rollback.
- PR #39: integración de recuperación entre dos bases: offline, reinicios, replay, convergencia y conflicto preservado.
- PR #41: `CloudSyncEngine` conecta cola/oplog/cursor con `CloudSyncProvider`; valida push confirmado solo tras write cloud, snapshots monotónicos por dispositivo, pull con cursor SHA-256, dos instalaciones convergentes, replay y rollback ante contenido remoto inválido/colisiones.

#### OAuth y seguridad verificados durante la sesión

- `drive.appdata` sigue siendo el scope mínimo para sincronización interna; `drive.file` se reserva para archivos visibles administrados por Cash-X.
- La guía vigente de Google para web recomienda Authorization Code por mayor seguridad, pero ese modelo requiere backend para el intercambio/almacenamiento de tokens.
- Cash-X mantiene la decisión de cero backend propio; por ello no se incrustará `client_secret`, no se guardarán refresh tokens en JavaScript y la estrategia PWA final requiere decisión explícita antes de release.
- Android puede avanzar sin backend usando Google Play services `AuthorizationClient` para obtener access tokens con scopes concedidos mientras la app está presente; no se solicitará offline server access.
- Dependencia candidata verificada al 2026-09-17: `com.google.android.gms:play-services-auth:22.0.0`, publicada por Google el 2026-08-26. Debe validarse en un spike aislado antes de quedar adoptada.

#### Estado actual de la sesión

- No existe todavía UI de producto utilizable ni versión estable.
- CI usa `npm ci`, typecheck, tests, build web, APK debug y probe runtime Android.
- Persistencia local, comprobantes, backup externo, transporte Drive simulado, conflictos/recuperación offline y protocolo cloud detrás de `CloudSyncProvider` están validados en el alcance actual.
- OAuth/Drive real todavía no está validado y no hay credenciales ni tokens reales en Git.
- La aplicación todavía **no debe usarse con datos financieros reales**: faltan núcleo financiero productivo, UI, E2E Drive real, sync remoto de comprobantes, resolución de conflictos, pruebas físicas y release.
- Siguiente paso: spike Android de autorización nativa `AuthorizationClient` detrás de `CloudAuthorizationProvider`; después configurar cliente OAuth Android de prueba fuera del repo y ejecutar `Android A -> appDataFolder -> Android B`.
- Estado de la sesión: activa.

## Regla para la próxima sesión

La próxima sesión solo podrá anunciar `Ing. Cash-X #2 💵` después de verificar este archivo, revisar el estado real del repositorio y registrar #2 en el repositorio.

Un chat nuevo debe poder reconstruir el estado desde `AGENT_RULES.md`, `docs/STATE.md`, `docs/PRODUCT_SPEC.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/PERSISTENCE.md`, `docs/BACKUP.md`, `docs/SYNC.md`, `docs/DRIVE.md` y este archivo sin depender de la conversación anterior.
