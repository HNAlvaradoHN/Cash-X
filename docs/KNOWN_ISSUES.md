# Known Issues

## KI-001 — No existe todavía una versión ejecutable de Cash-X

- Síntoma: no hay build, APK ni PWA de Cash-X.
- Causa: el proyecto terminó apenas su checkpoint de base limpia y todavía no inició implementación funcional.
- Impacto: aún no puede usarse para registrar movimientos.
- Workaround: ninguno; el siguiente paso es definir correctamente el contrato funcional antes de programar.
- Prioridad: alta.
- Estado: abierto.

## KI-002 — CI de Cash-X aún no configurado

- Síntoma: `main` no ejecuta validaciones automáticas de Cash-X.
- Causa: todavía no existe código de aplicación que compilar o probar.
- Impacto: no hay build automatizado actual.
- Workaround: ninguno necesario en esta fase.
- Prioridad: media.
- Estado: abierto; se abordará cuando exista una base de código que justifique CI.

## KI-003 — Nombres de ramas legacy todavía visibles

- Síntoma: aparecen ramas con nombres del proyecto anterior.
- Causa: la conexión actual de GitHub permite mover referencias pero no eliminar ramas.
- Impacto: únicamente visual/organizativo; todas apuntan al mismo commit que `main` y no contienen trabajo único activo.
- Workaround: no usarlas. Pueden eliminarse manualmente desde GitHub cuando se desee.
- Prioridad: baja.
- Estado: neutralizado, pendiente solo de eliminación de nombres.

## Nota de seguridad sobre historial anterior

Las referencias activas ya no apuntan al payload legacy. Los objetos Git antiguos pueden seguir siendo accesibles temporalmente mediante SHA. No hay evidencia de secretos visibles en `main`; cualquier credencial real que alguna vez se hubiera publicado tendría que rotarse aunque el commit deje de estar referenciado.
