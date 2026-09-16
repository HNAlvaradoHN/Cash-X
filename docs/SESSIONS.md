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
- TeraBox queda como proveedor futuro solamente si existe API oficial adecuada y una necesidad aprobada.
- `AttachmentStore` separa los comprobantes del motor concreto de almacenamiento; el primer adaptador usa `Blob` en IndexedDB y puede sustituirse por OPFS/filesystem nativo si las pruebas lo exigen.

#### Validaciones técnicas completadas en Checkpoint 3

- PR #14 `spike(persistence): validate local Dexie foundation`: integrado. Añadió scaffold de aplicación, Dexie/IndexedDB, migración, Papelera/restauración, backup/restauración idempotente a nivel de objetos y CI.
- PR #15 `docs(state): close local persistence spike`: integrado.
- PR #17 `ci(android): validate generated Capacitor build`: integrado. Generación de proyecto Android, `cap sync`, Gradle `assembleDebug` y APK debug verdes en CI.
- PR #18 `docs(state): close Android build spike`: integrado.
- PR #20 `test(android): validate WebView IndexedDB persistence`: integrado. Android API 35 emulado escribió datos reales en Dexie/IndexedDB, cerró forzosamente la app y los releyó íntegros en un segundo arranque frío.
- PR #21 `docs(state): record Android WebView persistence validation`: integrado.
- PR #23 `feat(attachments): validate local Blob storage and cleanup`: integrado. Añadió `AttachmentStore`/`DexieAttachmentStore` y validó comprobantes `Blob`, varios adjuntos, integridad de bytes/metadatos, rechazo de huérfanos, rollback de lote, Papelera/restauración, purge y persistencia binaria tras reapertura también en Android WebView emulado.
- El primer intento del test de comprobantes detectó una incompatibilidad de tipos de TypeScript 7 entre `Uint8Array<ArrayBufferLike>` y `BlobPart`; se corrigió creando el `Blob` desde un `ArrayBuffer` explícito y la validación posterior quedó verde.

#### Estado actual de la sesión

- Ya existe código técnico Cash-X, aunque todavía no una UI de producto utilizable.
- Existe CI propio con typecheck, tests, build web, build Android debug y prueba runtime en emulador.
- Persistencia estructurada y primer almacenamiento local de comprobantes están validados en el alcance actual.
- La aplicación todavía **no debe usarse con datos financieros reales** porque faltan núcleo financiero completo, UI, backup externo binario, sincronización Drive, validaciones físicas y release.
- Siguiente paso real: versionar `package-lock.json`, cambiar CI a instalación reproducible con `npm ci`, después definir/probar backup externo con binarios y continuar con Google Drive.
- Estado de la sesión: activa.

## Regla para la próxima sesión

La próxima sesión solo podrá anunciar `Ing. Cash-X #2 💵` después de verificar este archivo, revisar el estado real del repositorio y registrar #2 en el repositorio.

Un chat nuevo debe poder reconstruir el estado desde `AGENT_RULES.md`, `docs/STATE.md`, `docs/PRODUCT_SPEC.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/PERSISTENCE.md`, `docs/SYNC.md` y este archivo sin depender de la conversación anterior.
