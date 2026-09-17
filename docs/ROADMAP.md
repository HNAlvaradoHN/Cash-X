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
- Dexie/IndexedDB detrás de contratos;
- CI reproducible con `package-lock.json` + `npm ci`;
- generación/build Android debug en CI;
- persistencia Dexie/IndexedDB validada en Android WebView emulado tras cierre/reapertura;
- `AttachmentStore`/`DexieAttachmentStore` con `Blob`, rollback, Papelera/restauración y persistencia Android emulada;
- backup externo `.cashx` v1 con bytes binarios, SHA-256, restore entre instalaciones e idempotencia;
- transporte Drive REST detrás de `CloudSyncProvider`, probado con HTTP simulado y `appDataFolder`;
- jerarquía visible estricta `Mi unidad/Cash-X/Backups|Exportaciones` sin archivos automáticos dispersos;
- operaciones versionadas, conflicto determinista y delete/restore versionados;
- oplog/conflictos persistentes;
- cola offline persistente con confirmación parcial y retry/backoff;
- cursor remoto persistente y pull transaccional con replay idempotente/rollback;
- E2E simulado de dos instalaciones con reinicios, convergencia y conflicto preservado;
- `CloudSyncEngine` sobre `CloudSyncProvider`: snapshots remotos por dispositivo, publicación monotónica, confirmación solo después de `put`, cursor SHA-256, replay y rollback ante contenido remoto inválido;
- spike Android de `play-services-auth:22.0.0`: `AuthorizationClient` + `AuthorizationRequest` + `Scopes.DRIVE_APPFOLDER` compilan con el stack actual; APK debug temporal aumentó ~3.50 MiB y la dependencia fue retirada del APK normal al cerrar la evidencia.

Siguiente trabajo dentro del checkpoint:

1. implementar un bridge Android pequeño para `AuthorizationClient` detrás de `CloudAuthorizationProvider`, encapsulando `play-services-auth` en la capa de plataforma y sin `requestOfflineAccess`;
2. configurar fuera del repositorio el cliente OAuth Android de prueba (`com.cashx.app` + firma de prueba) y solicitar únicamente `drive.appdata` para el primer E2E;
3. ejecutar `Android A -> appDataFolder -> Android B` con la misma cuenta, verificando push/pull real e integridad;
4. repetir offline/reconexión, retry/replay e incompatibilidad concurrente sobre Drive real;
5. definir explícitamente el modelo OAuth PWA antes de release: Google recomienda code flow, pero exige backend; Cash-X mantiene cero backend y no adoptará silenciosamente un modelo web menos seguro;
6. incorporar comprobantes al sync vivo remoto con hash, identidad estable, cleanup y recuperación de fallos parciales;
7. validar desconexión/reconexión de Drive sin pérdida local;
8. probar límites/cuotas y fallos agresivos de red/almacenamiento;
9. realizar prueba física Android antes de una entrega real;
10. implementar después el núcleo financiero productivo independiente de UI y sus pruebas;
11. diseñar UX de resolución de conflictos antes de exponer sincronización multi-dispositivo.

La UI final no se construye hasta cerrar las validaciones necesarias de persistencia/sincronización.

## Checkpoint 4 — Interfaz base

Construir dashboard, libros, alta/edición de ingresos y egresos, historial y filtros sobre APIs internas ya probadas. La UI debe poder sustituirse sin reescribir dominio/persistencia.

## Checkpoint 5 — PWA offline

Completar instalación PWA, caché de recursos, persistencia del navegador y experiencia visible de sincronización. La estrategia OAuth PWA debe estar decidida antes de habilitar Drive aquí.

## Checkpoint 6 — Android y CI

Materializar APK/AAB reproducible, capacidades nativas y validaciones Android. El build debug y persistencia básica ya se validan desde Checkpoint 3; aquí se completan release, firma segura y capacidades nativas sin exponer claves.

## Checkpoint 7 — Reportes, exportación y backup

Añadir PDF/CSV/Excel y completar UX de backup/restauración versionado, incluida integración opcional con Google Drive. El contenedor `.cashx` v1 ya queda definido desde Checkpoint 3.

## Fuera de alcance hasta existir necesidad aprobada

- backend propio obligatorio de sincronización;
- Supabase/Firebase/Cloudflare como backend obligatorio;
- cuentas Cash-X en nube obligatorias;
- multiusuario concurrente colaborativo sobre un mismo libro;
- suscripciones;
- analítica invasiva;
- integración bancaria;
- inventario;
- IA;
- conversión automática de moneda;
- contabilidad avanzada no requerida;
- TeraBox u otros proveedores hasta validar API oficial y necesidad real.
