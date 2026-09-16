# Known Issues

## KI-001 — Cash-X aún no es una aplicación utilizable

- Síntoma: todavía no existe PWA funcional de producto ni APK para uso financiero real.
- Causa: el núcleo financiero y la UI final aún no están implementados.
- Impacto: no debe usarse todavía con datos financieros reales.
- Prioridad: alta.
- Estado: abierto.

## KI-002 — CI de Cash-X

- Estado: resuelto en PR #14 y ampliado en PR #17, PR #20 y PR #23.
- Resultado: CI ejecuta instalación, typecheck, tests, build web, build Android debug y prueba de persistencia Dexie/IndexedDB tras cierre/reapertura en Android emulado; el probe incluye ahora un comprobante `Blob` y valida sus bytes después del segundo arranque.

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
- Estado: abierto; siguiente paso de Checkpoint 3.

## KI-005 — Persistencia dentro de Android WebView

- Estado: resuelto para el escenario técnico actual por PR #20 y ampliado por PR #23.
- Evidencia: Android API 35 emulado conserva datos estructurados y un comprobante binario después de cierre forzado y segundo arranque frío.
- Límite de la evidencia: todavía no existe prueba en dispositivo físico ni medición de cuotas/archivos grandes representativos de uso real.

## KI-006 — Tamaño/cuota real de comprobantes aún no fijado

- Evidencia actual: un `Blob` de 1 MiB sobrevive a cierre/reapertura en el entorno IndexedDB automatizado y un comprobante binario pequeño sobrevive al ciclo real del Android WebView emulado.
- Impacto: no debe inventarse todavía un límite máximo de archivo ni prometer capacidad uniforme entre navegadores/dispositivos.
- Mitigación: `AttachmentStore` permite cambiar a OPFS/filesystem nativo si las pruebas físicas lo justifican.
- Prioridad: media antes de release.
- Estado: abierto.

## KI-007 — Formato externo de backup con binarios pendiente

- Síntoma: el backup actual es suficiente para probar restauración idempotente a nivel de objetos, pero no existe todavía un contenedor externo versionado para transportar los bytes de los comprobantes.
- Riesgo: un `Blob` no debe asumirse serializable a JSON como contenido binario.
- Impacto: backup manual entre instalaciones y Google Drive no se consideran terminados todavía.
- Prioridad: alta dentro de Checkpoint 3 antes de sincronización real.
- Estado: abierto.

## Nota de seguridad sobre historial anterior

Las referencias activas ya no apuntan al payload legacy. Los objetos Git antiguos pueden seguir siendo accesibles temporalmente mediante SHA. No hay evidencia de secretos visibles en `main`; cualquier credencial real que alguna vez se hubiera publicado tendría que rotarse aunque el commit deje de estar referenciado.
