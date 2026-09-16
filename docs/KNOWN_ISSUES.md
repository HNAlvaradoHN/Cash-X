# Known Issues

## KI-001 — Cash-X aún no es una aplicación utilizable

- Síntoma: todavía no existe PWA funcional de producto ni APK instalable para uso real.
- Causa: solo se ha iniciado el spike técnico de persistencia; el núcleo financiero y la UI aún no están implementados.
- Impacto: no debe usarse todavía para registrar datos financieros reales.
- Workaround: ninguno; continuar Checkpoint 3 antes de construir UI.
- Prioridad: alta.
- Estado: abierto.

## KI-002 — CI de Cash-X

- Estado: resuelto en PR #14.
- Resultado: GitHub Actions ejecuta instalación, typecheck, tests y build para PR/push a `main`.
- Nota: el primer run del spike local terminó correctamente.

## KI-003 — Nombres de ramas legacy todavía visibles

- Síntoma: pueden aparecer ramas con nombres del proyecto anterior.
- Causa: la conexión de GitHub permite mover referencias pero no eliminar ramas.
- Impacto: únicamente visual/organizativo; no forman parte del desarrollo activo de Cash-X.
- Workaround: no usarlas; pueden eliminarse manualmente desde GitHub.
- Prioridad: baja.
- Estado: neutralizado, pendiente solo de eliminación de nombres.

## KI-004 — Falta `package-lock.json`

- Síntoma: `npm install` resuelve dependencias transitivas sin un lockfile versionado.
- Causa: el primer scaffold se creó desde la conexión GitHub y no desde un entorno local con npm capaz de generar el lockfile.
- Impacto: el spike es validable, pero la instalación todavía no es suficientemente reproducible para release.
- Workaround: dependencias directas fijadas a versiones exactas y CI verde.
- Prioridad: media antes de cualquier release.
- Estado: abierto; generar y revisar lockfile en el siguiente entorno npm disponible.

## KI-005 — Capacitor aún no validado en Android real

- Síntoma: existe `capacitor.config.ts`, pero todavía no se ha generado/probado el proyecto Android ni el runtime WebView.
- Impacto: IndexedDB/Dexie está validado por pruebas Node/fake-indexeddb, no todavía dentro de Android.
- Prioridad: alta dentro de Checkpoint 3.
- Estado: abierto; es el siguiente tramo del spike.

## Nota de seguridad sobre historial anterior

Las referencias activas ya no apuntan al payload legacy. Los objetos Git antiguos pueden seguir siendo accesibles temporalmente mediante SHA. No hay evidencia de secretos visibles en `main`; cualquier credencial real que alguna vez se hubiera publicado tendría que rotarse aunque el commit deje de estar referenciado.
