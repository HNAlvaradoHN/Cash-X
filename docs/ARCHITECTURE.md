# Arquitectura de Cash-X

Estado: arquitectura inicial definida; implementación de aplicación aún no iniciada.

## Objetivo arquitectónico

Cash-X debe ser offline-first, modular y fácil de rediseñar sin tocar reglas financieras ni datos.

## Capas previstas

### UI

Pantallas, dashboard, navegación, formularios, componentes, estilos y accesibilidad.

No debe contener reglas de cálculo financiero ni acceso directo al almacenamiento.

### Aplicación / dominio

Casos de uso y reglas de negocio: libros, ingresos/egresos, categorías, campo adicional, saldos, validaciones y operaciones sobre registros.

Debe ser independiente del framework visual, del navegador, de Capacitor y del mecanismo concreto de persistencia.

Modelo lógico detallado: `docs/DOMAIN_MODEL.md`.

### Persistencia

Los casos de uso dependen de contratos de repositorio, nunca de una base de datos concreta.

Para v0.1 se adopta IndexedDB mediante Dexie como adaptador inicial tanto en PWA como dentro del runtime Android de Capacitor. La decisión, criterios y condiciones de revisión están documentados en `docs/PERSISTENCE.md`.

Regla de acceso:

`UI -> casos de uso -> contratos de repositorio -> adaptador Dexie/IndexedDB`

Los componentes visuales no acceden directamente a Dexie.

### Adjuntos

Gestión de fotos/PDF u otros comprobantes: ubicación, metadatos mínimos, límites, limpieza y vínculo con registros. No deben entrar al repositorio Git.

El dominio usa una abstracción `AttachmentStore`. El adaptador inicial v0.1 puede usar un almacén binario dedicado de IndexedDB para mantener una sola implementación PWA/Android. Si las pruebas de volumen lo justifican, ese adaptador podrá sustituirse por OPFS en web y sistema de archivos nativo en Android sin tocar el dominio.

### Exportación y backup

Servicios separados para generar reportes, exportar datos y crear/restaurar respaldos. Restaurar debe validar formato, versión e integridad y evitar corrupción o duplicación.

El backup es obligatorio aunque el almacenamiento local sea persistente: borrar datos del navegador, borrar datos de la app, desinstalar o perder el dispositivo puede eliminar la copia local.

El respaldo versionado será también la vía inicial para trasladar datos entre una instalación PWA y una instalación APK, ya que son almacenamientos separados.

### Plataforma

Cash-X conserva una sola base de código TypeScript + Vite.

La PWA se ejecuta directamente en el navegador. Android se empaqueta con Capacitor, produciendo un proyecto Android/APK/AAB y permitiendo usar APIs nativas cuando hagan falta, por ejemplo cámara, archivos, compartir y biometría.

El dominio no depende directamente de Capacitor. Toda capacidad específica de plataforma se expone mediante adaptadores.

## Persistencia PWA

La PWA solicitará almacenamiento persistente mediante la Storage API cuando esté disponible y comprobará si fue concedido. La aplicación debe seguir ofreciendo backup aunque el navegador conceda persistencia.

## Persistencia Android

Durante v0.1, el runtime Android reutiliza Dexie/IndexedDB para evitar dos motores de base de datos y dos sistemas de migraciones antes de que exista evidencia de necesidad.

SQLite nativo no se adopta de inicio. Puede añadirse posteriormente como otro adaptador si pruebas reales justifican el costo de migración.

## Regla de desacoplamiento visual

Un reemplazo completo del dashboard debe poder realizarse manteniendo intactas las capas de dominio y persistencia, salvo que cambien requisitos funcionales.

## Datos conceptuales

- Libro/Caja.
- Categoría.
- Registro financiero: ingreso o egreso.
- Campo adicional y opciones.
- Comprobante/Adjunto.

No se añadirá backend, sincronización multiusuario ni nube hasta que exista una necesidad de producto aprobada.
