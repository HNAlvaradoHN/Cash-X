# Estado del proyecto

**Fecha:** 2026-09-16  
**Sesión oficial:** Cash-X #1

## Repositorio

- Oficial: `HNAlvaradoHN/Cash-X`.
- Visibilidad: pública.
- Rama principal: `main`.
- Versión estable: ninguna.
- Versión en desarrollo: pre-0.1.
- PR #14 `spike(persistence): validate local Dexie foundation`: integrado.
- Issue #11 `Checkpoint 3 spike: validate local persistence foundation`: cerrado como completado por PR #14.
- PR activo después de integrar PR #14: ninguno.
- Issues #12 y #13 fueron creados accidentalmente por tooling y quedaron cerrados como `not_planned`; no contienen trabajo de proyecto.

## Estado funcional

El contrato funcional está definido en `docs/PRODUCT_SPEC.md`, el modelo técnico en `docs/DOMAIN_MODEL.md`, persistencia/plataforma en `docs/PERSISTENCE.md` y sincronización opcional en `docs/SYNC.md`.

Continúan aprobadas las reglas de libros independientes, ingreso/egreso, categorías configurables, campo adicional opcional, dinero exacto, cálculo automático, Papelera 30 días, comprobantes opcionales, reportes detallados posteriores, modo local completo y Google Drive opcional sin backend propio.

## Checkpoint 3 — Persistencia local, dominio y sincronización

**Estado: en progreso.**

### Modelo de dominio

**Formalización lógica completada.**

### Persistencia local — primer tramo del spike

**Completado e integrado en `main`.**

Se añadió:

- scaffold mínimo TypeScript + Vite;
- Dexie/IndexedDB como adaptador local inicial;
- esquema v1→v2 con migración;
- operaciones de Papelera/restauración;
- backup/restauración versionado e idempotente;
- configuración base de Capacitor;
- CI de aplicación.

Validaciones automáticas del PR #14: instalación, typecheck, 5 pruebas de persistencia y build, todas correctas.

Las pruebas cubren:

- persistencia tras cerrar/reabrir;
- rollback de transacción fallida;
- Papelera y restauración;
- migración de esquema sin perder libro;
- restauración repetida del mismo backup sin duplicados.

### Pendiente del spike

- generar y validar runtime Android real con Capacitor;
- validar IndexedDB/Dexie dentro del WebView Android;
- probar comprobantes binarios y límites reales;
- probar cleanup y recuperación ante fallos de escritura/migración más agresivos;
- generar `package-lock.json` para instalaciones reproducibles;
- implementar y probar Google OAuth/Drive;
- probar dos instalaciones, offline/reconexión, idempotencia y conflictos.

## CI

Cash-X ya tiene CI propio en `.github/workflows/ci.yml`. El PR #14 pasó instalación, typecheck, tests y build antes de integrarse.

## Trabajo paralelo

No hay PR funcional abierto ni trabajo paralelo identificado.

## Siguiente paso exacto

**Completar el segundo tramo del spike: generar/validar Capacitor Android y comprobar persistencia real en WebView. Después, añadir el adaptador mínimo de Google Drive. No construir dashboard todavía.**
