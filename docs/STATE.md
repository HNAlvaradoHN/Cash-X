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

## Versiones

- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- Contrato funcional v0.1: definido y refinado durante Checkpoint 3.
- Código de aplicación Cash-X: aún no iniciado.
- Último punto estable de aplicación: no existe todavía.
- Despliegue estable: ninguno.
- Despliegue experimental: ninguno.

## Estado funcional

El comportamiento de producto aprobado está registrado en `docs/PRODUCT_SPEC.md` y las decisiones relevantes en `docs/DECISIONS.md`.

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

Ya se refinaron las reglas funcionales y de integridad necesarias para modelar libros, ingresos/egresos, categorías, campo adicional, eliminación/restauración y saldos automáticos.

Pendiente antes de programar UI:

1. definir formalmente entidades y contratos de dominio a partir del contrato aprobado;
2. evaluar y decidir persistencia local con criterios de integridad, migración, backup y compatibilidad PWA/Android;
3. implementar el núcleo financiero independiente de UI;
4. añadir pruebas de saldo, edición, fechas, Papelera, restauración, referencias históricas y validaciones;
5. validar recuperación/migración básica.

## CI

Cash-X todavía no tiene CI de aplicación porque aún no existe código que compilar o probar. Los runs históricos pertenecen al proyecto anterior y no representan el estado de Cash-X.

Los cambios actuales son únicamente de documentación/contrato, por lo que todavía no existe una validación de build de aplicación aplicable.

## Trabajo paralelo

No hay trabajo funcional Cash-X pendiente de integrar.

## Siguiente paso exacto

**Continuar Checkpoint 3: traducir las reglas aprobadas a entidades/contratos de dominio y comparar opciones de persistencia local para PWA + Android antes de escribir el núcleo financiero.**
