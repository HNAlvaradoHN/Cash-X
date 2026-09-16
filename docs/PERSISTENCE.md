# Persistencia y plataforma de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** decisión aprobada; persistencia local y build Android validados, runtime Android/Drive pendientes

## Objetivo

Mantener una sola base de código para PWA y Android, priorizando integridad de datos, simplicidad, mantenimiento y operación offline.

## Decisión v0.1

- TypeScript + Vite como base.
- PWA offline-first.
- Android mediante Capacitor, sin reescribir dominio/UI en Kotlin.
- IndexedDB mediante Dexie para datos estructurados locales en PWA y, sujeto a validación de runtime, dentro de Android WebView.
- Acceso únicamente mediante contratos de persistencia; UI no toca Dexie directamente.
- Comprobantes detrás de `AttachmentStore`.
- Google Drive opcional detrás de `CloudSyncProvider`; sin backend propio de Cash-X.
- SQLite queda como alternativa futura solo si evidencia real justifica migrar.

## Datos estructurados

El adaptador Dexie cubre libros, ingresos/egresos, categorías, campo adicional, Papelera, metadatos de comprobantes, configuración y versiones de esquema. Operaciones relacionadas que deban ser atómicas usan transacciones.

## Comprobantes

El primer adaptador puede almacenar `Blob` en IndexedDB separado de las tablas lógicas. Antes de release se probarán tamaño, memoria, lectura, eliminación y cleanup. Si los binarios grandes no son adecuados, `AttachmentStore` podrá usar OPFS en PWA y filesystem nativo en Android sin tocar el dominio.

## Persistencia PWA y Android

La PWA solicitará almacenamiento persistente cuando sea posible, pero el almacenamiento local nunca sustituye un backup.

El APK/AAB reutiliza la misma aplicación mediante Capacitor. La generación del proyecto Android, `cap sync` y un APK debug ya fueron validados en CI. Falta validar que Dexie/IndexedDB se comporte correctamente durante ejecución y reapertura dentro de Android WebView.

La configuración de Capacitor se mantiene en `capacitor.config.json`. Se eligió JSON después de comprobar que el loader de `capacitor.config.ts` de Capacitor 8.5.2 no es compatible con TypeScript 7.0.2 bajo el Node 22.12 usado por el proyecto. El cambio evita flags experimentales y reduce acoplamiento de herramientas.

## Google Drive opcional

- Sin Drive, Cash-X funciona completamente local.
- Con Drive, cada dispositivo mantiene copia local y sincroniza mediante Google OAuth/Drive.
- Se prioriza `drive.appdata`; respaldos visibles creados por Cash-X pueden usar `drive.file`.
- No se solicita acceso amplio a todo el Drive.
- Sync debe ser idempotente, recuperable y conservar conflictos concurrentes en vez de sobrescribirlos.
- Desconectar Drive no borra datos locales.
- TeraBox queda como proveedor futuro solo mediante API oficial validada.

Contrato completo: `docs/SYNC.md`.

## Validaciones completadas

PR #14 validó en entorno automatizado con `fake-indexeddb`:

- abrir/cerrar/reabrir datos;
- rollback atómico ante error;
- Papelera/restauración;
- migración v1→v2;
- backup/restauración repetida sin duplicados;
- typecheck y build.

PR #17 valida en CI:

- generación del proyecto Android con Capacitor;
- sincronización de assets web;
- build Gradle `assembleDebug`;
- creación de APK debug como artefacto.

El build Android exitoso **no equivale todavía a validación de persistencia en WebView**.

## Dependencias del spike

Versiones directas fijadas tras revisión de mantenimiento/licencia/compatibilidad:

- Dexie 4.4.6 — Apache-2.0;
- Capacitor core/CLI/Android 8.5.2 — MIT;
- Vite 8.3.0 — MIT;
- TypeScript 7.0.2;
- Vitest 5.0.1 — MIT;
- fake-indexeddb 6.2.5 — Apache-2.0, solo pruebas.

Falta `package-lock.json`; se considera pendiente de reproducibilidad antes de release.

## Validaciones restantes de Checkpoint 3

- ejecución Android WebView y persistencia real tras reapertura;
- comprobantes binarios y límites;
- cleanup y recuperación ante fallos;
- backup entre instalaciones reales;
- Google OAuth/Drive;
- dos instalaciones offline/reconexión;
- conflicto concurrente sin pérdida silenciosa;
- desconexión/reconexión Drive.

## Regla de arquitectura

`UI -> casos de uso -> contratos de repositorio -> Dexie/IndexedDB`

`                                 -> SyncEngine -> CloudSyncProvider -> Google Drive`

Capacitor, APIs de navegador, OAuth y proveedores cloud pertenecen a adaptadores de plataforma, no al dominio.
