# Estado del proyecto

**Fecha:** 2026-09-16  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`
- Visibilidad: pública.
- Rama principal: `main`.
- Rama de trabajo del checkpoint actual: `chore/cash-x-bootstrap`.
- PR abiertos antes de este checkpoint: ninguno.

## Versiones

- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1 (definición/arquitectura; sin build de Cash-X).
- Último punto estable de aplicación: no existe todavía.
- Despliegue estable: ninguno.
- Despliegue experimental: ninguno.

## Estado funcional

No existe todavía código de aplicación Cash-X en `main`. El repositorio se está preparando como base limpia antes de programar.

## Hechos verificados al iniciar Cash-X #1

- `main` contenía solo documentación/configuración genérica del proyecto anterior.
- Existían ramas legacy de REyDI/Gestión Iglesia con payloads de build Android y workflows ajenos a Cash-X.
- `feat/definir-funcionalidad` era idéntica a `main`.
- No había Pull Requests.
- No existe CI de Cash-X en `main`.
- La documentación decía todavía `Mi PWA App` y que GitHub era privado, por lo que estaba desactualizada.
- No se detectaron secretos visibles en los archivos de `main`; las ramas legacy contienen un payload comprimido opaco que no forma parte de Cash-X y no debe reutilizarse.

## Checkpoint actual

**Checkpoint 1 — Limpiar y establecer la base oficial de Cash-X.**

Incluye:

- actualizar reglas y documentación;
- reforzar exclusiones de archivos privados;
- definir arquitectura modular inicial;
- registrar seguridad, decisiones, roadmap y sesiones;
- retirar de uso las ramas legacy sin fusionarlas en Cash-X.

No incluye código funcional de la app, dependencias nuevas, base de datos, backend ni CI de compilación.

## Siguiente paso exacto

Después de cerrar este checkpoint: **Checkpoint 2 — definir el contrato funcional mínimo de libros, movimientos, categorías, saldos, edición/eliminación y comprobantes antes de elegir persistencia o construir UI.**
