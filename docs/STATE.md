# Estado del proyecto

**Fecha:** 2026-09-16  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`
- Visibilidad: pública.
- Rama principal: `main`.
- PR activo después de integrar la documentación actual: ninguno.
- PR #1 `chore(project): bootstrap Cash-X repository`: integrado.
- PR #2 `docs(project): close bootstrap checkpoint`: integrado.
- PR #3 `docs(product): define Cash-X v0.1 functional contract`: integrado.
- PR #4 `docs(state): close functional contract checkpoint`: integrado.
- PR #5 `docs(rules): add visual explanation rule`: integrado.
- PR #6 `docs(product): persist checkpoint 3 domain rules`: integrado.
- PR #7 `docs(product): define amount calculator behavior`: integrado.
- PR #8 `docs(domain): formalize core model contracts`: integrado.
- PR #9 `docs(architecture): choose unified PWA Android persistence`: integrado.

## Versiones

- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- Contrato funcional v0.1: definido y refinado durante Checkpoint 3.
- Modelo lógico de dominio: formalizado en `docs/DOMAIN_MODEL.md`.
- Estrategia de persistencia/plataforma v0.1: definida en `docs/PERSISTENCE.md`.
- Sincronización opcional Google Drive: arquitectura definida en `docs/SYNC.md`.
- Código de aplicación Cash-X: aún no iniciado.
- Último punto estable de aplicación: no existe todavía.
- Despliegue estable: ninguno.
- Despliegue experimental: ninguno.

## Estado funcional

El comportamiento de producto aprobado está registrado en `docs/PRODUCT_SPEC.md`, las decisiones relevantes en `docs/DECISIONS.md`, el modelo técnico lógico en `docs/DOMAIN_MODEL.md`, persistencia/plataforma en `docs/PERSISTENCE.md` y sincronización opcional en `docs/SYNC.md`.

El núcleo incluye libros independientes, ingresos/egresos, categorías configurables, campo adicional opcional por libro, saldo inicial opcional, cálculo automático de saldo, historial, búsqueda/filtros, Papelera con retención de 30 días, varios comprobantes opcionales, reportes detallados posteriores, funcionamiento offline y respaldo local manual.

### Refinamientos aprobados en Checkpoint 3

- UI principal usa `+ Ingreso` y `− Egreso`;
- nombre y moneda obligatorios por libro;
- saldo inicial, icono y color opcionales;
- archivo/restauración de libros sin pérdida;
- color principal elegido por usuario con tonalidad secundaria automática;
- iconos desde catálogo integrado o emoji;
- monto, descripción, categoría y fecha obligatorios en ingreso/egreso;
- hora de creación/modificación automática e interna;
- `Más detalles` cerrado por defecto para nota, referencia/persona y comprobantes;
- campo adicional configurable por libro con nombre y opciones personalizadas; si no existe, no aparece;
- todos los saldos derivados se recalculan automáticamente;
- contenido variable acotado en previews para no romper diseño;
- toda acción destructiva iniciada por usuario requiere confirmación;
- Papelera retiene hasta 30 días y permite restaurar;
- eliminar un libro mueve/restaura la unidad completa con sus relaciones;
- categorías/opciones usadas históricamente pueden retirarse del catálogo sin borrar su valor de registros existentes;
- el campo de monto acepta operaciones aritméticas simples con cálculo exacto;
- reportes v0.1 serán por un solo libro, con periodo semana/mes/año/rango personalizado y libro mayor cronológico con saldo acumulado;
- modo local completo sin cuenta ni nube obligatoria;
- sincronización cloud opcional con Google Drive, sin backend propio de Cash-X;
- misma cuenta Google puede conectar teléfono/tablet/PWA/PC al mismo espacio de sincronización;
- TeraBox queda como proveedor futuro evaluable, no como dependencia inicial.

## Checkpoint 1 — Base limpia del proyecto

**Estado: completado.**

Resultado verificado:

- documentación y reglas oficiales de Cash-X establecidas;
- arquitectura separa UI, dominio, persistencia, adjuntos, backup/exportación y plataforma;
- UI definida como reemplazable sin reescribir dominio ni persistencia;
- seguridad y privacidad documentadas;
- ramas legacy neutralizadas;
- sin código funcional heredado activo.

## Checkpoint 2 — Contrato funcional mínimo

**Estado: completado.**

Contrato base detallado: `docs/PRODUCT_SPEC.md`.

## Checkpoint 3 — Persistencia local, dominio y sincronización

**Estado: en progreso.**

### Modelo de dominio

**Formalización lógica completada.**

`docs/DOMAIN_MODEL.md` define entidades, dinero exacto, fechas, orden determinista, referencias históricas, Papelera, comprobantes, saldos derivados, contratos e invariantes.

### Persistencia y plataforma

**Decisión arquitectónica completada; falta validación práctica.**

Para v0.1:

- una sola base de código TypeScript + Vite;
- PWA como aplicación web instalable;
- Android mediante Capacitor, sin reescribir dominio/UI en Kotlin;
- IndexedDB mediante Dexie como almacenamiento estructurado tanto en PWA como en el runtime Android;
- acceso a datos únicamente mediante contratos de repositorio;
- comprobantes detrás de una abstracción separada `AttachmentStore`;
- SQLite queda como opción futura solo si pruebas reales justifican una migración.

### Sincronización opcional

**Arquitectura definida; falta validación práctica.**

- sin Google Drive, toda la información permanece local y Cash-X sigue funcionando;
- con Google Drive, cada dispositivo conserva su copia local y sincroniza cambios mediante `CloudSyncProvider`;
- no se usará Supabase, Firebase, Cloudflare ni backend propio para esta función;
- no habrá correo+PIN propio; Google OAuth autentica/autoriza la cuenta que usa Drive;
- la sincronización interna prioriza `drive.appdata` y mínimo privilegio;
- respaldos visibles creados por Cash-X pueden usar `drive.file`;
- conflictos concurrentes del mismo registro no se sobrescriben silenciosamente;
- la PWA no promete sincronización continua mientras el navegador esté completamente cerrado;
- respaldo/restauración manual sigue siendo fallback;
- TeraBox se evaluará únicamente como adaptador futuro oficial.

Pendiente antes de programar UI:

1. ejecutar un spike real Dexie + Capacitor;
2. validar migraciones, transacciones, recuperación ante fallos, Papelera/restauración y cleanup;
3. validar comprobantes y límites de tamaño;
4. validar backup/restauración entre instalaciones de prueba;
5. validar Google OAuth/Drive en PWA y Android;
6. validar sincronización entre dos instalaciones, offline/reconexión, idempotencia y conflictos;
7. implementar el núcleo financiero independiente de UI si el spike pasa;
8. añadir pruebas del dominio, persistencia y sync.

## CI

Cash-X todavía no tiene CI de aplicación porque aún no existe código que compilar o probar. Los runs históricos pertenecen al proyecto anterior y no representan el estado de Cash-X.

Los cambios actuales siguen siendo de documentación/arquitectura; no existe todavía una validación de build de aplicación aplicable.

## Trabajo paralelo

No hay trabajo funcional Cash-X pendiente de integrar.

## Siguiente paso exacto

**Continuar Checkpoint 3 implementando un spike mínimo de Dexie/IndexedDB + Capacitor con modo local primero y un adaptador Google Drive opcional. No construir dashboard todavía. El spike debe validar persistencia offline, transacciones, migraciones, recuperación, comprobantes, backup/restauración, autorización Drive, convergencia entre dos dispositivos, conflictos e idempotencia antes de empezar el núcleo financiero.**
