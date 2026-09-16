# Roadmap de Cash-X

El orden puede cambiar si aparece nueva evidencia. Cada checkpoint se cierra antes de iniciar el siguiente.

## Checkpoint 1 — Base limpia del proyecto

**Estado: completado en Cash-X #1.**

Resultado: repositorio oficial documentado, reglas registradas, seguridad/privacidad definidas, arquitectura modular inicial establecida y ramas legacy neutralizadas sin integrarlas en Cash-X.

## Checkpoint 2 — Contrato funcional mínimo

**Estado: completado en Cash-X #1.**

Resultado aprobado:

- libros/cajas independientes;
- ingreso y egreso;
- saldo inicial opcional;
- categorías configurables;
- cálculo de saldo en dominio;
- edición de registros;
- Papelera con restauración y borrado definitivo confirmado;
- fechas, ordenamiento, búsqueda y filtros;
- comprobantes opcionales múltiples;
- una moneda por libro;
- reportes básicos por periodo;
- operación esencial offline;
- respaldo local manual como primera estrategia;
- PIN/biometría opcionales cuando la plataforma lo permita;
- sin login ni nube obligatorios en v0.1.

Contrato detallado: `docs/PRODUCT_SPEC.md`.

## Checkpoint 3 — Persistencia local, dominio y sincronización opcional

**Estado: en progreso en Cash-X #1.**

Ya definidos/refinados:

- forma funcional de libros, ingreso/egreso, categorías y campo adicional opcional;
- timestamps internos automáticos y fecha de negocio editable;
- recálculo automático de saldos;
- integridad histórica al retirar categorías/opciones usadas;
- confirmación para acciones destructivas;
- Papelera con retención máxima de 30 días;
- restauración de libros completos como unidad lógica;
- límites de contenido variable en previews;
- calculadora integrada para monto con precisión financiera;
- modelo lógico formalizado en `docs/DOMAIN_MODEL.md`;
- representación exacta de dinero, fechas, identificadores, referencias históricas, comprobantes y contratos de dominio;
- estrategia de plataforma: una base TypeScript + Vite, PWA y Android mediante Capacitor;
- persistencia v0.1: IndexedDB mediante Dexie en PWA y Android, detrás de contratos de repositorio;
- comprobantes detrás de `AttachmentStore`, con adaptador inicial simple y posibilidad de cambiar a OPFS/sistema de archivos nativo si las pruebas lo justifican;
- modo completamente local sin cuenta ni nube;
- Google Drive como único proveedor cloud inicial y opcional, detrás de `CloudSyncProvider`;
- sin Supabase, Firebase, Cloudflare ni backend propio para autenticación/sincronización;
- Google OAuth en lugar de un sistema propio de correo+PIN;
- sincronización interna con mínimo privilegio (`drive.appdata`) y respaldos visibles opcionales mediante `drive.file`;
- protocolo de sync idempotente, versionado y tolerante a red interrumpida;
- conflictos sobre el mismo registro preservados para resolución, sin sobrescritura silenciosa;
- backup/restauración manual como fallback cuando Drive no esté conectado o falle;
- TeraBox reservado para evaluación futura mediante API oficial, no como dependencia inicial.

Siguiente trabajo dentro del checkpoint:

1. implementar un spike mínimo local con Dexie y Capacitor;
2. validar creación/apertura offline, transacciones, migraciones y recuperación ante fallos;
3. validar Papelera/restauración y cleanup;
4. validar comprobantes de prueba y límites;
5. validar backup/restauración entre instalaciones de prueba;
6. añadir un adaptador mínimo Google Drive y probar OAuth en PWA y Android;
7. validar sincronización de dos instalaciones, trabajo offline, reconexión, idempotencia y reintentos;
8. provocar un conflicto concurrente sobre el mismo registro y demostrar que no existe pérdida silenciosa;
9. validar desconexión/reconexión de Drive conservando datos locales;
10. si el spike completo pasa, implementar el núcleo financiero independiente de UI;
11. añadir pruebas del dominio, persistencia y sincronización.

La UI será mínima y no definirá la arquitectura.

## Checkpoint 4 — Interfaz base

Construir dashboard, libros, alta/edición de ingresos y egresos, historial y filtros sobre las APIs internas ya probadas.

Validar accesibilidad y que cambiar el dashboard no afecte dominio/persistencia.

## Checkpoint 5 — PWA offline

Completar instalación PWA, caché de recursos, solicitud/verificación de almacenamiento persistente y comportamiento sin red sin comprometer datos privados.

Integrar la experiencia visible de sincronización opcional: estado local/sincronizando/sin conexión/error, `Sincronizar ahora`, conectar/desconectar Google Drive y recuperación clara ante autorización vencida.

## Checkpoint 6 — Android y CI

Materializar la estrategia ya elegida con Capacitor: proyecto Android, APK/AAB reproducible y acceso a capacidades nativas necesarias. Configurar CI público sin subir claves de firma ni datos privados.

Validar autenticación Google/Drive en Android y almacenamiento seguro de credenciales/tokens que correspondan al adaptador nativo, sin mover esas responsabilidades al dominio.

## Checkpoint 7 — Reportes, exportación y backup

Añadir exportaciones PDF/CSV/Excel y completar un formato de respaldo/restauración versionado y validado.

Cuando Google Drive esté conectado, permitir guardar respaldos/exportaciones visibles creados por Cash-X en una estructura administrada por la aplicación sin solicitar acceso amplio al Drive completo.

Dirección funcional ya acordada para PDF:

- un solo libro por reporte;
- semana, mes, año o rango personalizado;
- resumen inicial de saldos/totales;
- libro mayor cronológico combinado con saldo acumulado;
- verificación matemática final;
- resumen por categorías;
- comprobantes incluidos por defecto, con diseño limpio y compatibilidad de adjuntos a validar antes de implementar.

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
- TeraBox u otros proveedores cloud adicionales hasta validar su API oficial y necesidad real.
