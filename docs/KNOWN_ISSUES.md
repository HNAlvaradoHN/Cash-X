# Known Issues

## KI-001 — Cash-X aún no es una aplicación utilizable

- Síntoma: todavía no existe PWA funcional de producto ni APK para uso financiero real.
- Causa: el núcleo financiero y la UI final aún no están implementados.
- Impacto: no debe usarse todavía con datos financieros reales.
- Prioridad: alta.
- Estado: abierto.

## KI-002 — CI de Cash-X

- Estado: resuelto en PR #14 y ampliado en PR #17.
- Resultado: CI ejecuta instalación, typecheck, tests, build web y build Android debug.

## KI-003 — Nombres de ramas legacy todavía visibles

- Impacto: únicamente visual/organizativo; no forman parte del desarrollo activo de Cash-X.
- Workaround: no usarlas; pueden eliminarse manualmente desde GitHub.
- Prioridad: baja.
- Estado: neutralizado, pendiente solo de eliminación de nombres.

## KI-004 — Falta `package-lock.json`

- Síntoma: `npm install` resuelve dependencias transitivas sin un lockfile versionado.
- Impacto: CI valida el spike, pero la instalación todavía no es suficientemente reproducible para release.
- Workaround: dependencias directas fijadas a versiones exactas.
- Prioridad: media antes de cualquier release.
- Estado: abierto.

## KI-005 — Persistencia todavía no validada dentro de Android WebView

- Estado previo: la generación y compilación Android ya fueron validadas por PR #17.
- Pendiente real: ejecutar la aplicación en emulador/dispositivo, escribir datos IndexedDB/Dexie, cerrar/reabrir y comprobar integridad.
- Impacto: todavía no puede afirmarse que la misma persistencia está validada en runtime Android.
- Prioridad: alta dentro de Checkpoint 3.
- Estado: abierto; es el siguiente tramo.

## Nota de seguridad sobre historial anterior

Las referencias activas ya no apuntan al payload legacy. Los objetos Git antiguos pueden seguir siendo accesibles temporalmente mediante SHA. No hay evidencia de secretos visibles en `main`; cualquier credencial real que alguna vez se hubiera publicado tendría que rotarse aunque el commit deje de estar referenciado.
