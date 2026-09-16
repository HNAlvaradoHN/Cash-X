# Persistencia y plataforma de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** decisión aprobada; primer spike local validado, Android/Drive pendientes

## Objetivo

Mantener una sola base de código para PWA y Android, priorizando integridad de datos, simplicidad, mantenimiento y operación offline.

## Decisión v0.1

- TypeScript + Vite como base.
- PWA offline-first.
- Android mediante Capacitor, sin reescribir dominio/UI en Kotlin.
- IndexedDB mediante Dexie para datos estructurados locales en PWA y, sujeto a validación, dentro del runtime Android.
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

El APK/AAB reutilizará la misma aplicación mediante Capacitor. La compatibilidad real de Dexie/IndexedDB en WebView Android debe validarse antes de declararla terminada.

## Google Drive opcional

- Sin Drive, Cash-X funciona completamente local.
- Con Drive, cada dispositivo mantiene copia local y sincroniza mediante Google OAuth/Drive.
- Se prioriza `drive.appdata`; respaldos visibles creados por Cash-X pueden usar `drive.file`.
- No se solicita acceso amplio a todo el Drive.
- Sync debe ser idempotente, recuperable y conservar conflictos concurrentes en vez de sobrescribirlos.
- Desconectar Drive no borra datos locales.
- TeraBox queda como proveedor futuro solo mediante API oficial validada.

Contrato completo: `docs/SYNC.md`.

## Primer spike local — resultado

PR #14 implementa el primer adaptador y CI. El primer run automático validó correctamente:

- abrir/cerrar/reabrir datos;
- rollback atómico ante error;
- Papelera/restauración;
- migración v1→v2;
- backup/restauración repetida sin duplicados;
- typecheck y build.

Esto valida la base lógica local en entorno de pruebas con `fake-indexeddb`. **No valida todavía el runtime Android real ni límites de comprobantes.**

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

- runtime Android/Capacitor;
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
