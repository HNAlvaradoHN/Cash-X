# Persistencia y plataforma de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** decisión aprobada para iniciar implementación v0.1

## Objetivo

Mantener una sola base de código para PWA y Android, priorizando integridad de datos, simplicidad, mantenimiento y operación offline sin introducir dos bases de datos distintas antes de que exista una necesidad demostrada.

## Decisión v0.1

### Base de aplicación

- TypeScript + Vite continúan como base web.
- La aplicación se construye primero como PWA offline-first.
- Android se empaqueta con Capacitor, generando un proyecto Android/APK/AAB real sin reescribir la aplicación en Kotlin.
- El dominio y los casos de uso no dependen de Capacitor ni del navegador.

### Datos estructurados

Cash-X usará IndexedDB mediante Dexie como persistencia estructurada inicial tanto en la PWA como dentro del runtime Android de Capacitor.

Esto mantiene una sola implementación de persistencia para v0.1 y cubre:

- libros;
- ingresos y egresos;
- categorías;
- campo adicional y opciones;
- estados de Papelera;
- metadatos de comprobantes;
- configuración local;
- versiones y migraciones de esquema.

Las escrituras que afecten varias entidades deberán ejecutarse dentro de transacciones de Dexie/IndexedDB cuando deban ser atómicas.

### Comprobantes

Los comprobantes conservan una abstracción separada del dominio (`AttachmentStore`).

Para v0.1, el adaptador inicial puede guardar los binarios como `Blob` en un almacén dedicado de IndexedDB, separado de las tablas estructuradas y relacionado por identificador estable.

Antes de liberar esta parte se probarán límites reales de tamaño, memoria, lectura y limpieza. Si esas pruebas muestran que los binarios grandes no son adecuados para IndexedDB, el adaptador podrá cambiarse sin tocar el dominio a:

- OPFS en PWA cuando sea apropiado;
- sistema de archivos nativo mediante Capacitor en Android.

No se añadirá esa complejidad antes de necesitarla.

## Persistencia en PWA

La PWA solicitará almacenamiento persistente mediante la Storage API cuando el navegador lo permita y comprobará si fue concedido.

Aunque se conceda persistencia, Cash-X no tratará el almacenamiento local como respaldo. El usuario podrá borrar datos del sitio o perder el dispositivo, por lo que el backup/restauración versionado sigue siendo obligatorio.

## Persistencia en Android

El APK/AAB de Capacitor reutilizará la misma aplicación y el mismo adaptador IndexedDB/Dexie durante v0.1.

El almacenamiento vive dentro del sandbox de la aplicación Android. Desinstalar la aplicación o borrar sus datos elimina el almacenamiento local, por lo que el backup sigue siendo necesario.

Capacitor se usa también como puerta de acceso a funciones nativas cuando correspondan, por ejemplo cámara, archivos, compartir y biometría.

## PWA y APK son instalaciones separadas

Los datos de una PWA instalada en el navegador no se comparten automáticamente con el APK porque cada instalación posee su propio almacenamiento local.

Cash-X mantiene dos mecanismos compatibles:

1. **sin Google Drive:** traslado manual mediante respaldo/restauración versionado;
2. **con Google Drive conectado:** sincronización opcional entre las copias locales de los dispositivos mediante la cuenta de Drive del usuario.

Google Drive no reemplaza la base local. Cada instalación conserva sus datos en Dexie/IndexedDB para poder seguir funcionando offline.

La arquitectura completa de sincronización está definida en `docs/SYNC.md`.

## Sincronización opcional con Google Drive

Cash-X no tendrá backend propio para sincronización y no dependerá de Supabase, Firebase, Cloudflare ni un servicio equivalente.

La sincronización inicial usa Google Drive como único proveedor cloud y se implementa detrás de `CloudSyncProvider`.

Reglas principales:

- sin Drive conectado, Cash-X funciona completamente local;
- al conectar Drive, Google OAuth autentica/autoriza la cuenta y Cash-X sincroniza con esa cuenta;
- no existe cuenta o contraseña propia de Cash-X para esta función;
- no se implementa correo + PIN propio porque enviar/verificar ese código requeriría un servicio externo confiable;
- la sincronización interna usa permisos mínimos, priorizando `drive.appdata`;
- respaldos/exportaciones visibles creados por Cash-X pueden usar `drive.file`;
- no se solicita acceso amplio a todo el Drive del usuario;
- cambios concurrentes del mismo registro nunca se sobrescriben silenciosamente;
- la sincronización debe ser idempotente y recuperable ante red interrumpida;
- desconectar Drive no borra los datos locales;
- borrar datos remotos es una acción separada y destructiva con confirmación.

La PWA sin backend no promete sincronización continua mientras el navegador esté completamente cerrado. Debe sincronizar al abrir, tras cambios locales, al recuperar conexión y mediante una acción manual; si Google requiere renovar autorización, se solicitará de forma explícita sin comprometer la copia local.

TeraBox queda detrás de la misma abstracción como proveedor posible futuro, pero no se implementa hasta validar su API oficial, OAuth, estabilidad, costos y garantías de integridad. No se usarán endpoints no oficiales para datos financieros.

## Por qué no SQLite desde el inicio

SQLite nativo sigue siendo una opción válida futura, pero no aporta suficiente beneficio en v0.1 para justificar una segunda implementación de persistencia.

No se adoptará inicialmente:

- SQLite nativo solo para Android, porque duplicaría adaptadores, migraciones y pruebas;
- SQLite WASM/OPFS como base web, porque añade complejidad de WASM, workers y compatibilidad sin una necesidad demostrada;
- una capa SQLite comunitaria multiplataforma como dependencia central, porque el producto todavía no necesita sus ventajas y su superficie de mantenimiento es mayor que Dexie/IndexedDB para este alcance.

## Cuándo reconsiderar SQLite

La decisión se revisará únicamente si aparece evidencia concreta, por ejemplo:

- volumen o consultas que no cumplan objetivos de rendimiento;
- necesidad de cifrado de base nativo que no pueda resolverse razonablemente con la arquitectura actual;
- requisitos de interoperabilidad SQL o tooling nativo;
- problemas demostrados de confiabilidad en WebView/IndexedDB;
- una función futura que justifique el costo de migración.

Si se cambia de motor, se implementará otro adaptador detrás de los contratos de persistencia y una migración explícita de datos; el dominio no se reescribe.

## Costos externos

Al momento de esta decisión, Google documenta el uso estándar de Drive API sin costo adicional dentro de sus cuotas estándar, con cambios de facturación previstos para uso que supere ciertos umbrales más adelante en 2026.

Cash-X debe minimizar solicitudes y no habilitar cuotas pagadas, facturación adicional ni servicios billables sin aprobación explícita del propietario.

El almacenamiento usado por los archivos de Cash-X consume la cuota normal de Google Drive de la cuenta del usuario.

## Validaciones obligatorias antes de considerar la persistencia lista

El spike de persistencia/sincronización debe demostrar como mínimo:

- crear y abrir la base offline;
- migrar de una versión de esquema a otra sin perder datos;
- escritura atómica de operaciones relacionadas;
- edición y recálculo sin duplicados;
- enviar a Papelera y restaurar;
- cleanup de registros y comprobantes expirados;
- guardar, leer y eliminar comprobantes de prueba dentro de límites definidos;
- exportar y restaurar un respaldo de prueba;
- funcionamiento tanto en navegador/PWA como en Android mediante Capacitor;
- recuperación limpia ante errores simulados de escritura/migración;
- modo local sin cuenta ni Drive;
- conectar la misma cuenta de Drive desde dos instalaciones y converger sin duplicados;
- trabajo offline en ambos dispositivos y sincronización posterior;
- conflicto concurrente sobre el mismo registro sin pérdida silenciosa;
- red interrumpida durante sincronización y reintento idempotente;
- desconectar/reconectar Drive sin perder datos locales.

## Regla de arquitectura

`UI -> casos de uso -> contratos de repositorio -> adaptador Dexie/IndexedDB`

`                                 -> SyncEngine -> CloudSyncProvider -> Google Drive`

Los componentes visuales nunca acceden directamente a Dexie ni a Google Drive. Capacitor, APIs de navegador, OAuth y proveedores cloud pertenecen a adaptadores de plataforma, no al dominio.
