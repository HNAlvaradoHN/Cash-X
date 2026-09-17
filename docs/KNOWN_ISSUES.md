# Known Issues

## KI-001 — Cash-X aún no es una aplicación utilizable

- Síntoma: todavía no existe PWA funcional de producto ni APK para uso financiero real.
- Causa: el núcleo financiero y la UI final aún no están implementados.
- Impacto: no debe usarse todavía con datos financieros reales.
- Prioridad: alta.
- Estado: abierto.

## KI-002 — CI de Cash-X

- Estado: resuelto en PR #14 y ampliado en PR #17, PR #20, PR #23, PR #25 y PR #27.
- Resultado: CI usa `npm ci` con `package-lock.json` versionado y ejecuta typecheck, tests, build web, build Android debug y prueba de persistencia Dexie/IndexedDB tras cierre/reapertura en Android emulado; el probe incluye un comprobante `Blob` y valida sus bytes después del segundo arranque. Las pruebas cubren también archivo externo `.cashx`, restauración entre dos bases, idempotencia y corrupción/truncamiento.

## KI-003 — Nombres de ramas legacy todavía visibles

- Impacto: únicamente visual/organizativo; no forman parte del desarrollo activo de Cash-X.
- Workaround: no usarlas; pueden eliminarse manualmente desde GitHub.
- Prioridad: baja.
- Estado: neutralizado, pendiente solo de eliminación de nombres.

## KI-004 — Falta `package-lock.json`

- Estado: resuelto por PR #25.
- Resultado: `package-lock.json` está versionado y CI instala con `npm ci`, fijando también dependencias transitivas para la revisión correspondiente.

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

## KI-007 — Formato externo de backup con binarios

- Estado: resuelto técnicamente por PR #27 para el contenedor v1.
- Resultado: `.cashx` transporta datos estructurados y comprobantes como bytes crudos, verifica manifiesto y payloads con SHA-256 y se restaura idempotentemente en una segunda instalación de prueba.
- Límite: todavía no existe UX final de exportar/importar ni prueba física con backups grandes.

## KI-008 — Backup `.cashx` v1 no está cifrado

- Síntoma: el archivo protege integridad, no confidencialidad.
- Impacto: quien obtenga una copia del `.cashx` puede potencialmente leer datos y comprobantes.
- Mitigación actual: tratar el archivo como información financiera privada y comunicarlo claramente en la futura UX de exportación.
- Evolución posible: añadir cifrado en una versión posterior del contenedor sin cambiar el dominio financiero.
- Prioridad: evaluar antes de release si el modelo de amenaza o distribución lo exige.
- Estado: abierto/documentado, no bloquea el spike de sincronización.

## KI-009 — Google Drive todavía no implementado

- Estado: abierto; siguiente paso exacto de Checkpoint 3.
- Alcance pendiente: OAuth con mínimo privilegio, `appDataFolder`, transporte de `.cashx`, dos instalaciones, reintentos, offline/reconexión y conflictos.
- Restricción: no introducir backend propio, Supabase, Firebase o Cloudflare para resolver esta parte.

## Nota de seguridad sobre historial anterior

Las referencias activas ya no apuntan al payload legacy. Los objetos Git antiguos pueden seguir siendo accesibles temporalmente mediante SHA. No hay evidencia de secretos visibles en `main`; cualquier credencial real que alguna vez se hubiera publicado tendría que rotarse aunque el commit deje de estar referenciado.
