# Arquitectura de Cash-X

Estado: definición inicial. No existe todavía implementación de aplicación.

## Objetivo arquitectónico

Cash-X debe ser offline-first, modular y fácil de rediseñar sin tocar reglas financieras ni datos.

## Capas previstas

### UI

Pantallas, dashboard, navegación, formularios, componentes, estilos y accesibilidad.

No debe contener reglas de cálculo financiero ni acceso directo al almacenamiento.

### Aplicación / dominio

Casos de uso y reglas de negocio: libros, movimientos, categorías, saldos, validaciones y operaciones sobre registros.

Debe ser independiente del framework visual y del mecanismo concreto de persistencia.

### Persistencia

Abstracción para guardar y recuperar datos locales. La tecnología concreta se elegirá en el checkpoint correspondiente después de definir requisitos de volumen, backup, migración y compatibilidad.

### Adjuntos

Gestión de fotos/PDF u otros comprobantes: ubicación, metadatos mínimos, límites, limpieza y vínculo con movimientos. No deben entrar al repositorio.

### Exportación y backup

Servicios separados para generar reportes, exportar datos y crear/restaurar respaldos. Restaurar debe validar formato y evitar corrupción o duplicación.

### Plataforma

Adaptadores específicos para PWA/Android, archivos, biometría, compartir y otras capacidades del dispositivo. El dominio no debe depender directamente de estas APIs.

## Regla de desacoplamiento visual

Un reemplazo completo del dashboard debe poder realizarse manteniendo intactas las capas de dominio y persistencia, salvo que cambien requisitos funcionales.

## Datos conceptuales iniciales

Todavía no son un esquema definitivo:

- Libro/Caja.
- Categoría.
- Movimiento (ingreso o egreso).
- Comprobante/Adjunto.

No se añadirá backend, sincronización multiusuario ni nube hasta que exista una necesidad de producto aprobada.
