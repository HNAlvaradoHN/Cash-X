# Sesiones de trabajo de Cash-X

Este archivo define la numeración oficial de chats de trabajo. No usar memoria de ChatGPT para inferir números.

## Formato de encabezado

`Ing. Cash-X #N 💵`

## Registro

### Cash-X #1

- Fecha de inicio: 2026-09-16.
- Motivo: inicio formal de Cash-X sobre el repositorio renombrado.
- Verificación inicial: completada antes de modificar.
- Estado encontrado: `main` sin código de aplicación; documentación genérica/desactualizada; sin PR; sin CI de Cash-X; ramas legacy de REyDI/Gestión Iglesia separadas de `main`.
- Checkpoint 1: base limpia del repositorio, completado.
- PR #1 `chore(project): bootstrap Cash-X repository`: integrado.
- PR #2 `docs(project): close bootstrap checkpoint`: integrado.
- Checkpoint 2: contrato funcional mínimo, completado.
- PR #3 `docs(product): define Cash-X v0.1 functional contract`: integrado.
- PR #4 `docs(state): close functional contract checkpoint`: integrado.
- Regla de explicación visual añadida para decisiones de producto y UX.
- PR #5 `docs(rules): add visual explanation rule`: integrado.
- Checkpoint 3: persistencia local y dominio, en progreso.

#### Decisiones refinadas durante Checkpoint 3

- La UI principal usa `+ Ingreso` y `− Egreso`; `movimiento` se reserva como término técnico interno cuando sea útil.
- Libros: nombre y moneda obligatorios; saldo inicial, icono y color opcionales; estado activo/archivado.
- Color: el usuario elige uno principal y Cash-X genera una tonalidad secundaria compatible.
- Icono: catálogo integrado o emoji en v0.1; sin logo/imagen personalizada.
- Formulario de ingreso/egreso: monto, descripción, categoría y fecha obligatorios; nota, referencia/persona y comprobantes bajo `Más detalles`, cerrado por defecto.
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

#### Estado actual de la sesión

- No existe todavía código funcional Cash-X.
- No existe CI de aplicación Cash-X.
- Las reglas funcionales necesarias para modelar el dominio están mucho más definidas.
- Siguiente paso real: formalizar entidades/contratos de dominio y evaluar persistencia local compatible con PWA + Android antes de implementar el núcleo financiero.
- Estado de la sesión: activa.

## Regla para la próxima sesión

La próxima sesión solo podrá anunciar `Ing. Cash-X #2 💵` después de verificar este archivo, revisar el estado real del repositorio y registrar #2 en el repositorio.

Un chat nuevo debe poder reconstruir el estado desde `AGENT_RULES.md`, `docs/STATE.md`, `docs/PRODUCT_SPEC.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` y este archivo sin depender de la conversación anterior.
