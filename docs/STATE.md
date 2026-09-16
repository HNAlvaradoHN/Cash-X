# Estado del proyecto

**Fecha:** 2026-09-16  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`
- Visibilidad: pública.
- Rama principal: `main`.
- PR activo: ninguno.
- PR #1 `chore(project): bootstrap Cash-X repository`: integrado.

## Versiones

- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1 (definición funcional pendiente; sin build de Cash-X).
- Último punto estable de aplicación: no existe todavía.
- Despliegue estable: ninguno.
- Despliegue experimental: ninguno.

## Estado funcional

No existe todavía código de aplicación Cash-X. El repositorio ya contiene únicamente la base documental/configuración oficial necesaria para empezar el diseño funcional sin arrastrar implementaciones anteriores.

## Checkpoint 1 — Base limpia del proyecto

**Estado: completado.**

Resultado verificado:

- README y reglas reemplazaron la documentación genérica anterior.
- Arquitectura inicial separa UI, dominio, persistencia, adjuntos, backup/exportación y plataforma.
- La UI quedó definida como reemplazable sin reescribir dominio ni persistencia.
- Se documentaron seguridad, privacidad, decisiones, roadmap, problemas conocidos y sesiones.
- `.gitignore` cubre secretos, claves, bases locales, respaldos, comprobantes y artefactos Android sensibles.
- `.env.example` vacío y `docs/PLAN.md` obsoleto fueron retirados.
- No se añadieron dependencias ni código funcional.
- PR #1 fue integrado a `main`.

## Ramas legacy

Las ramas heredadas `apk-build-gestion-iglesia`, `reydi-payload-prep` y `feat/definir-funcionalidad` ya no contienen trabajo distinto: sus referencias fueron movidas al mismo commit que `main`. La rama temporal `chore/cash-x-bootstrap` también fue neutralizada al terminar el PR.

Los nombres de esas ramas todavía existen porque la conexión actual permite mover referencias pero no eliminarlas. No deben usarse para trabajo nuevo.

Importante: commits antiguos pueden seguir siendo accesibles por SHA durante un tiempo aunque ninguna rama los apunte. Si una credencial real hubiera estado allí, debe rotarse; no hay evidencia de secretos visibles en el `main` actual.

## CI

Cash-X todavía no tiene CI porque aún no existe código que compilar o probar. Los runs históricos pertenecían al proyecto anterior y no representan el estado de Cash-X.

## Trabajo paralelo

No hay PR ni rama con trabajo funcional Cash-X pendiente de integrar.

## Siguiente paso exacto

**Checkpoint 2 — definir el contrato funcional mínimo de libros, movimientos, categorías, saldos, edición/eliminación, fechas, moneda y comprobantes antes de elegir persistencia o construir el dashboard.**
