# Roadmap de Cash-X

El orden puede cambiar si aparece nueva evidencia. Cada checkpoint se cierra antes de iniciar el siguiente.

## Checkpoint 1 — Base limpia del proyecto

**Estado: completado en Cash-X #1.**

## Checkpoint 2 — Contrato funcional mínimo

**Estado: completado en Cash-X #1.**

Contrato detallado: `docs/PRODUCT_SPEC.md`.

## Checkpoint 3 — Persistencia local, dominio y sincronización opcional

**Estado: en progreso en Cash-X #1.**

Ya completado:

- reglas funcionales e integridad histórica;
- modelo lógico formalizado;
- arquitectura TypeScript + Vite, PWA + Capacitor;
- Dexie/IndexedDB detrás de contratos de repositorio;
- Google Drive opcional detrás de `CloudSyncProvider`, sin backend propio;
- primer spike local con pruebas verdes de reapertura, atomicidad, Papelera/restauración, migración e importación idempotente;
- CI propio;
- generación de proyecto Android con Capacitor y compilación de APK debug en CI;
- persistencia real Dexie/IndexedDB validada en Android WebView emulado: escritura, cierre forzado, reapertura e integridad;
- `AttachmentStore` + `DexieAttachmentStore` con `Blob` validados: varios comprobantes, reapertura, rollback de lote, Papelera/restauración, purge y bytes persistidos también en Android WebView emulado;
- `package-lock.json` versionado y CI migrado a instalación reproducible con `npm ci`;
- formato externo `.cashx` v1 validado con manifiesto versionado, bytes binarios crudos, SHA-256, restauración entre dos instalaciones de prueba, idempotencia y detección de corrupción/truncamiento;
- transporte Google Drive REST detrás de contratos, probado con HTTP simulado: `appDataFolder`, actualización idempotente, descarga, backoff acotado, cancelación/timeout preparados y jerarquía visible `Mi unidad/Cash-X/Backups|Exportaciones` sin archivos automáticos dispersos en la raíz.

Siguiente trabajo dentro del checkpoint:

1. configurar fuera del repositorio OAuth client IDs de prueba para PWA y Android/Capacitor y validar autorización real con scopes mínimos;
2. guardar/leer un backup `.cashx`/objeto de sincronización real en `appDataFolder` y recuperarlo desde una segunda instalación autorizada con la misma cuenta;
3. validar dos instalaciones, trabajo offline, reconexión, reintentos e idempotencia;
4. provocar conflicto concurrente y demostrar ausencia de pérdida silenciosa;
5. validar desconexión/reconexión de Drive sin perder datos locales;
6. probar límites/cuotas y fallos agresivos de almacenamiento en dispositivo;
7. realizar una prueba física Android antes de una entrega real;
8. cuando el spike completo pase, implementar núcleo financiero independiente de UI;
9. añadir pruebas del dominio financiero.

La UI final no se construye hasta cerrar las validaciones de persistencia necesarias.

## Checkpoint 4 — Interfaz base

Construir dashboard, libros, alta/edición de ingresos y egresos, historial y filtros sobre APIs internas ya probadas. La UI debe poder sustituirse sin reescribir dominio/persistencia.

## Checkpoint 5 — PWA offline

Completar instalación PWA, caché de recursos, persistencia del navegador y experiencia visible de sincronización.

## Checkpoint 6 — Android y CI

Materializar APK/AAB reproducible, capacidades nativas y validaciones Android. El build debug, la persistencia básica WebView y un comprobante Blob ya se validan desde Checkpoint 3; aquí se completarán release, firma segura y capacidades nativas sin exponer claves.

## Checkpoint 7 — Reportes, exportación y backup

Añadir PDF/CSV/Excel y completar UX de backup/restauración versionado, incluyendo integración opcional con Google Drive. El contenedor técnico `.cashx` v1 queda definido desde Checkpoint 3 para poder validar sincronización antes de construir la UI final.

## Fuera de alcance hasta existir necesidad aprobada

- backend propio de sincronización;
- Supabase/Firebase/Cloudflare como backend obligatorio;
- cuentas Cash-X en nube obligatorias;
- multiusuario concurrente sobre un mismo libro;
- suscripciones;
- analítica invasiva;
- integración bancaria;
- inventario;
- IA;
- conversión automática de moneda;
- contabilidad avanzada no requerida;
- TeraBox u otros proveedores adicionales hasta validar API oficial y necesidad real.
