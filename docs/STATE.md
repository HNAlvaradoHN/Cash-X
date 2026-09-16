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

## Versiones

- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- Contrato funcional v0.1: definido y refinado durante Checkpoint 3.
- Modelo lógico de dominio: formalizado en `docs/DOMAIN_MODEL.md`.
- Código de aplicación Cash-X: aún no iniciado.
- Último punto estable de aplicación: no existe todavía.
- Despliegue estable: ninguno.
- Despliegue experimental: ninguno.

## Estado funcional

El comportamiento de producto aprobado está registrado en `docs/PRODUCT_SPEC.md`, las decisiones relevantes en `docs/DECISIONS.md` y el modelo técnico lógico en `docs/DOMAIN_MODEL.md`.

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
- reportes v0.1 serán por un solo libro, con periodo semana/mes/año/rango personalizado y libro mayor cronológico con saldo acumulado.

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

## Checkpoint 3 — Persistencia local y dominio

**Estado: en progreso.**

### Modelo de dominio

**Formalización lógica completada.**

`docs/DOMAIN_MODEL.md` define:

- entidades Libro, Registro financiero, Categoría, Campo adicional/Opciones y Comprobante;
- dinero exacto en unidades menores, portable entre persistencias;
- fecha de negocio separada de timestamps técnicos;
- orden histórico determinista;
- referencias/fallbacks para conservar historial tras purgas;
- Papelera como estado lógico con retención de 30 días;
- eliminación/restauración de libros como agregados;
- saldos derivados como fuente de verdad reconstruible;
- contratos de casos de uso e invariantes que deben probarse.

Pendiente antes de programar UI:

1. comparar y decidir persistencia local con criterios de integridad, migración, backup, archivos adjuntos y compatibilidad PWA/Android;
2. implementar el núcleo financiero independiente de UI sobre contratos de persistencia;
3. añadir pruebas de dinero, saldo, edición, fechas, Papelera, restauración, referencias históricas y validaciones;
4. validar migraciones, recuperación y cleanup de archivos.

## CI

Cash-X todavía no tiene CI de aplicación porque aún no existe código que compilar o probar. Los runs históricos pertenecen al proyecto anterior y no representan el estado de Cash-X.

Los cambios actuales son únicamente de documentación/contrato, por lo que todavía no existe una validación de build de aplicación aplicable.

## Trabajo paralelo

No hay trabajo funcional Cash-X pendiente de integrar.

## Siguiente paso exacto

**Continuar Checkpoint 3 comparando opciones concretas de persistencia local para PWA + Android. La decisión debe cubrir integridad, transacciones, migraciones, backup/restauración, archivos/comprobantes, compatibilidad, mantenimiento y costo antes de escribir el núcleo financiero.**
