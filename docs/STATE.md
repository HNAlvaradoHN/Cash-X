# Estado del proyecto

**Fecha:** 2026-09-16  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`
- Visibilidad: pública.
- Rama principal: `main`.
- Rama de trabajo actual: `docs/functional-contract-v01`.
- PR activo: pendiente de abrir al cerrar este checkpoint documental.
- PR #1 `chore(project): bootstrap Cash-X repository`: integrado.
- PR #2 `docs(project): close bootstrap checkpoint`: integrado.

## Versiones

- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- Contrato funcional v0.1: definido.
- Código de aplicación Cash-X: aún no iniciado.
- Último punto estable de aplicación: no existe todavía.
- Despliegue estable: ninguno.
- Despliegue experimental: ninguno.

## Estado funcional

El comportamiento mínimo de Cash-X ya está definido en `docs/PRODUCT_SPEC.md`.

El núcleo aprobado incluye libros independientes, ingresos/egresos, categorías configurables, saldo inicial opcional, cálculo de saldo, historial, búsqueda/filtros, Papelera, varios comprobantes opcionales, reportes básicos, funcionamiento offline y respaldo local manual.

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

**Estado: completado, pendiente únicamente de integrar el PR documental.**

Decisiones confirmadas:

- saldo inicial: opcional, cero por defecto;
- Papelera: obligatoria para eliminación normal, con restauración;
- borrado definitivo: requiere confirmación explícita;
- comprobantes: cero, uno o varios por movimiento; nunca obligatorios;
- una moneda por libro en v0.1;
- operaciones esenciales sin internet;
- sin login ni nube obligatorios;
- fuera de alcance: sincronización multiusuario, bancos, inventario, IA y contabilidad avanzada.

## CI

Cash-X todavía no tiene CI de aplicación porque aún no existe código que compilar o probar. Los runs históricos pertenecen al proyecto anterior y no representan el estado de Cash-X.

Para este checkpoint documental no hay validaciones de build aplicables; la validación consiste en revisar consistencia entre contrato, decisiones, roadmap y estado.

## Trabajo paralelo

No hay trabajo funcional Cash-X paralelo pendiente de integrar.

## Siguiente paso exacto

**Checkpoint 3 — definir entidades y contratos de dominio, evaluar la persistencia local adecuada para PWA/Android y después implementar el núcleo financiero con pruebas antes de construir el dashboard.**
