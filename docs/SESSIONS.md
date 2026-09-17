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
- PR #1 `chore(project): bootstrap Cash-X repository`: integrado.
- PR #2 `docs(project): close bootstrap checkpoint`: integrado.
- Checkpoint 2: contrato funcional mínimo, completado.
- PR #3 `docs(product): define Cash-X v0.1 functional contract`: integrado.
- PR #4 `docs(state): close functional contract checkpoint`: integrado.
- Regla de explicación visual añadida para decisiones de producto y UX.
- PR #5 `docs(rules): add visual explanation rule`: integrado.
- Checkpoint 3: persistencia local, dominio y sincronización opcional, en progreso.

#### Decisiones refinadas durante Checkpoint 3

- La UI principal usa `+ Ingreso` y `− Egreso`; `movimiento` se reserva como término técnico interno cuando sea útil.
- Libros: nombre y moneda obligatorios; saldo inicial, icono y color opcionales; estado activo/archivado.
- Color: el usuario elige uno principal y Cash-X genera una tonalidad secundaria compatible.
- Icono: catálogo integrado o emoji en v0.1; sin logo/imagen personalizada.
- Formulario de ingreso/egreso: monto, descripción, categoría y fecha obligatorios; nota, referencia/persona y comprobantes bajo `Más detalles`, cerrado por defecto.
- El campo monto admite operaciones de calculadora (`200 + 100`, etc.); se guarda el resultado exacto y la aritmética financiera no usa errores de coma flotante como fuente de verdad.
- La fecha es editable; la hora no se pide al usuario y los timestamps reales se guardan automáticamente.
- Campo adicional opcional por libro: el usuario define el nombre visible (`Actividad`, `Sucursal`, `Proyecto`, etc.) y sus opciones. Si no existe, no aparece en formulario, historial, detalle ni reporte.
- Si un campo existe pero un registro no tiene valor, se usa `—` en vistas tabulares/reportes cuando corresponda.
- Todo cálculo de saldo y recálculo por cambios de monto, tipo, fecha, saldo inicial, eliminación/restauración es automático.
- Todo contenido variable de previews/listas debe estar acotado para no romper el diseño; el detalle muestra el contenido completo.
- Toda acción destructiva iniciada por el usuario exige confirmación previa.
- Papelera: retención máxima de 30 días, restauración disponible y eliminación definitiva manual con nueva confirmación; la limpieza automática al expirar no vuelve a preguntar.
- Eliminar un libro mueve/restaura el libro entero como unidad con todos sus datos relacionados.
- Si una categoría u opción del campo adicional nunca fue usada, puede eliminarse después de confirmar.
- Si ya fue usada, al confirmar deja de estar disponible para nuevos registros pero los registros históricos continúan mostrándola; editar un registro histórico no obliga a reemplazarla.
- Reportes: un libro por reporte; periodos semana, mes, año o rango personalizado; resumen inicial, detalle cronológico combinado con saldo acumulado, verificación matemática y resumen por categorías.
- `Incluir comprobantes` estará activado por defecto en PDF; se busca mantener el PDF limpio y se evaluará compatibilidad real de adjuntos integrados antes de prometer soporte universal.
- No seguir profundizando ahora en detalles cosméticos de PDF; la implementación de reportes pertenece a un checkpoint posterior.

#### Arquitectura y persistencia aprobadas

- Una sola base de código TypeScript + Vite.
- PWA offline-first y Android mediante Capacitor.
- Persistencia estructurada local con Dexie/IndexedDB detrás de contratos; UI no accede directamente a Dexie.
- Sin Supabase, Firebase, Cloudflare ni backend propio obligatorio.
- Sin conexión a nube, Cash-X funciona completamente con almacenamiento local.
- Google Drive será el proveedor cloud opcional inicial mediante Google OAuth; cada dispositivo conserva una copia local y sincroniza cuando Drive está conectado.
- Se prioriza acceso limitado de Drive (`appDataFolder`/archivos de la aplicación) en lugar de acceso amplio al Drive del usuario.
- Los datos técnicos de sincronización viven en `appDataFolder`; archivos visibles automáticos viven únicamente bajo `Mi unidad/Cash-X/Backups` o `Mi unidad/Cash-X/Exportaciones`, reutilizando la misma jerarquía y sin dispersarse por la raíz.
- TeraBox queda como proveedor futuro solamente si existe API oficial adecuada y una necesidad aprobada.
- `AttachmentStore` separa los comprobantes del motor concreto de almacenamiento; el primer adaptador usa `Blob` en IndexedDB y puede sustituirse por OPFS/filesystem nativo si las pruebas lo exigen.
- El backup externo inicial usa un único archivo `.cashx` versionado con manifiesto JSON, bytes binarios crudos e integridad SHA-256. v1 no cifra el contenido.
- La sincronización no usa “último en escribir gana” silencioso: operaciones concurrentes incompatibles del mismo objeto se conservan como conflicto explícito.
- El estado de sincronización recuperable se divide en oplog/conflictos persistentes, cola offline de salida y cursor remoto de entrada; todos deben sobrevivir reinicios antes de conectar Drive real.

#### Validaciones técnicas completadas en Checkpoint 3

- PR #14 `spike(persistence): validate local Dexie foundation`: integrado. Añadió scaffold de aplicación, Dexie/IndexedDB, migración, Papelera/restauración, backup/restauración idempotente a nivel de objetos y CI.
- PR #15 `docs(state): close local persistence spike`: integrado.
- PR #17 `ci(android): validate generated Capacitor build`: integrado. Generación de proyecto Android, `cap sync`, Gradle `assembleDebug` y APK debug verdes en CI.
- PR #18 `docs(state): close Android build spike`: integrado.
- PR #20 `test(android): validate WebView IndexedDB persistence`: integrado. Android API 35 emulado escribió datos reales en Dexie/IndexedDB, cerró forzosamente la app y los releyó íntegros en un segundo arranque frío.
- PR #21 `docs(state): record Android WebView persistence validation`: integrado.
- PR #23 `feat(attachments): validate local Blob storage and cleanup`: integrado. Añadió `AttachmentStore`/`DexieAttachmentStore` y validó comprobantes `Blob`, varios adjuntos, integridad de bytes/metadatos, rechazo de huérfanos, rollback de lote, Papelera/restauración, purge y persistencia binaria tras reapertura también en Android WebView emulado.
- El primer intento del test de comprobantes detectó una incompatibilidad de tipos de TypeScript 7 entre `Uint8Array<ArrayBufferLike>` y `BlobPart`; se corrigió creando el `Blob` desde un `ArrayBuffer` explícito y la validación posterior quedó verde.
- PR #25 `chore(ci): make dependency installation reproducible`: integrado. Añadió `package-lock.json` y migró CI a `npm ci`.
- PR #27 `feat(backup): validate external binary backup format`: integrado. Añadió el contenedor `.cashx`, validación SHA-256, prueba source→archivo→segunda instalación, restauración idempotente y rechazo de corrupción/truncamiento sin nuevas dependencias de producción.
- PR #29 `feat(sync): add ordered Google Drive transport`: integrado. Añadió contratos de autorización/sincronización, cliente REST Drive v3, `GoogleDriveCloudSyncProvider`, almacenamiento visible ordenado, reintentos acotados, timeout/cancelación preparados y tests HTTP simulados para `appDataFolder`, actualización sin duplicados, descarga y jerarquía `Cash-X/Backups|Exportaciones`.
- PR #31 `feat(sync): validate deterministic conflict core`: integrado. Añadió operaciones versionadas, deduplicación, fusión de cambios independientes, conflicto explícito concurrente, delete/restore versionados y rechazo de colisiones de identidad.
- PR #33 `feat(sync): persist operation log and conflict state`: integrado. Persistió oplog/conflictos en Dexie con ingestión transaccional, idempotencia, reapertura y rollback.
- PR #35 `feat(sync): add persistent offline replay queue`: integrado. Añadió `syncQueue`, orden determinista, confirmación parcial, retry/backoff y persistencia tras reinicio.
- PR #37 `feat(sync): persist remote pull cursor`: integrado. Añadió `remoteSyncCursors` y pull transaccional: cursor solo avanza tras página completa, replay idempotente, rechazo de páginas fuera de orden y rollback de cursor/operaciones ante colisión.
- PR #39 `test(sync): validate restart recovery invariants`: integrado al cerrar este tramo. Integra las piezas anteriores en pruebas con dos bases independientes: trabajo offline, push/pull simulado, reinicios, confirmación parcial, retry, replay, convergencia al mismo oplog, conflicto concurrente preservado en ambos lados y fallo de página sin avance falso.

#### Estado actual de la sesión

- Ya existe código técnico Cash-X, aunque todavía no una UI de producto utilizable.
- Existe CI propio con `npm ci`, typecheck, tests, build web, build Android debug y prueba runtime en emulador.
- Persistencia estructurada, comprobantes locales, backup externo, transporte Drive simulado y motor local/simulado de sincronización recuperable están validados en el alcance actual.
- Dos instalaciones simuladas ya demuestran convergencia después de trabajar offline y reiniciar; una edición concurrente incompatible permanece como conflicto explícito en ambos lados en vez de perderse silenciosamente.
- Google OAuth real todavía no está validado: se requieren client IDs de prueba y consentimiento fuera del repositorio; no se guardarán secretos/tokens reales en Git.
- La aplicación todavía **no debe usarse con datos financieros reales** porque faltan núcleo financiero completo, UI, E2E Drive real, resolución de conflictos, validaciones físicas y release.
- Siguiente paso real: configurar OAuth de prueba fuera del repositorio y demostrar el primer E2E real entre dos instalaciones con la misma cuenta Google, usando `appDataFolder` y sin backend propio; después repetir offline/reconexión y conflicto contra Drive real.
- Estado de la sesión: activa.

## Regla para la próxima sesión

La próxima sesión solo podrá anunciar `Ing. Cash-X #2 💵` después de verificar este archivo, revisar el estado real del repositorio y registrar #2 en el repositorio.

Un chat nuevo debe poder reconstruir el estado desde `AGENT_RULES.md`, `docs/STATE.md`, `docs/PRODUCT_SPEC.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/PERSISTENCE.md`, `docs/BACKUP.md`, `docs/SYNC.md`, `docs/DRIVE.md` y este archivo sin depender de la conversación anterior.
