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

Los datos de una PWA instalada en el navegador no se transfieren automáticamente al APK, porque cada instalación posee su propio almacenamiento local.

La estrategia v0.1 para pasar datos entre ambas será:

1. exportar un respaldo versionado desde la instalación de origen;
2. importar y validar ese respaldo en la instalación destino;
3. no duplicar ni reinterpretar registros durante la restauración.

No se requiere nube ni cuenta de usuario para este proceso.

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

## Validaciones obligatorias antes de considerar la persistencia lista

El spike de persistencia debe demostrar como mínimo:

- crear y abrir la base offline;
- migrar de una versión de esquema a otra sin perder datos;
- escritura atómica de operaciones relacionadas;
- edición y recálculo sin duplicados;
- enviar a Papelera y restaurar;
- cleanup de registros y comprobantes expirados;
- guardar, leer y eliminar comprobantes de prueba dentro de límites definidos;
- exportar y restaurar un respaldo de prueba;
- funcionamiento tanto en navegador/PWA como en Android mediante Capacitor;
- recuperación limpia ante errores simulados de escritura/migración.

## Regla de arquitectura

`UI -> casos de uso -> contratos de repositorio -> adaptador Dexie/IndexedDB`

Los componentes visuales nunca acceden directamente a Dexie. Capacitor y APIs de navegador pertenecen a adaptadores de plataforma, no al dominio.
