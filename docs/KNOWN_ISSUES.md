# Known Issues

## KI-001 — No existe todavía una versión ejecutable de Cash-X

- Síntoma: no hay build, APK ni PWA de Cash-X.
- Causa: el proyecto está en fase de definición y limpieza del repositorio.
- Impacto: todavía no puede usarse para registrar movimientos.
- Workaround: ninguno; no se debe acelerar saltando la definición funcional.
- Prioridad: alta.
- Estado: esperado; se resolverá progresivamente desde Checkpoint 2.

## KI-002 — CI de Cash-X aún no configurado

- Síntoma: `main` no ejecuta validaciones automáticas de Cash-X.
- Causa: todavía no existe código de aplicación que compilar o probar.
- Impacto: no hay build automatizado actual.
- Workaround: validación manual de documentación durante el bootstrap.
- Prioridad: media.
- Estado: se abordará cuando exista una base de código que justifique CI.

## KI-003 — Historial legacy ajeno a Cash-X

- Síntoma: ramas heredadas contienen payloads y workflows de REyDI/Gestión Iglesia.
- Causa: el repositorio fue reutilizado para Cash-X.
- Impacto: confusión y posible exposición innecesaria de artefactos antiguos en un repositorio ahora público.
- Workaround: no fusionar ni reutilizar esos contenidos; retirar sus referencias activas durante el bootstrap.
- Prioridad: alta.
- Estado: en limpieza durante Cash-X #1.

Nota de seguridad: no hay evidencia de secretos visibles en `main`. El payload legacy está comprimido y no se considera confiable ni parte de Cash-X; si alguna clave real hubiera sido incluida históricamente, debe rotarse independientemente de borrar una rama.
