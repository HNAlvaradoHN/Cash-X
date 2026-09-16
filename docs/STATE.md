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
- PR #15 `docs(state): close local persistence spike`: integrado.
- PR #17 `ci(android): validate generated Capacitor build`: integrado.
- Issue #16 `Checkpoint 3 spike: validate Capacitor Android build`: cerrado como completado por PR #17.
- PR funcional activo después de integrar PR #17: ninguno.
- Issues #12 y #13 fueron creados accidentalmente por tooling y están cerrados como `not_planned`; no contienen trabajo de proyecto.

## Estado funcional

El contrato funcional está definido en `docs/PRODUCT_SPEC.md`, el modelo técnico en `docs/DOMAIN_MODEL.md`, persistencia/plataforma en `docs/PERSISTENCE.md` y sincronización opcional en `docs/SYNC.md`.

Continúan aprobadas las reglas de libros independientes, ingreso/egreso, categorías configurables, campo adicional opcional, dinero exacto, cálculo automático, Papelera 30 días, comprobantes opcionales, reportes detallados posteriores, modo local completo y Google Drive opcional sin backend propio.

## Checkpoint 3 — Persistencia local, dominio y sincronización

**Estado: en progreso.**

### Modelo de dominio

**Formalización lógica completada.**

### Persistencia local — primer tramo

**Completado e integrado en `main`.**

PR #14 añadió scaffold TypeScript + Vite, Dexie/IndexedDB, migración de esquema, Papelera/restauración, backup/restauración idempotente y CI. Sus pruebas cubren reapertura, rollback atómico, Papelera/restauración, migración y restauración repetida sin duplicados.

### Android — segundo tramo

**Generación y build debug completados e integrados; runtime WebView todavía pendiente.**

PR #17 validó en CI:

- generación temporal de `android/` con Capacitor;
- sincronización de assets web;
- compilación Gradle `assembleDebug` con JDK 21;
- creación y subida de APK debug como artefacto temporal.

El primer intento detectó una incompatibilidad entre `capacitor.config.ts`, TypeScript 7.0.2 y el loader de Capacitor 8.5.2. La causa se corrigió usando `capacitor.config.json`; después pasaron tanto el job web como el job Android.

Esto valida el **build Android**, no la ejecución en un emulador/teléfono ni IndexedDB dentro de WebView.

### Pendiente del spike

- ejecutar Cash-X dentro de WebView Android real/emulado y validar persistencia/reapertura;
- probar comprobantes binarios y límites reales;
- probar cleanup y recuperación ante fallos más agresivos;
- generar `package-lock.json` para instalaciones reproducibles;
- implementar y probar Google OAuth/Drive;
- probar dos instalaciones, offline/reconexión, idempotencia y conflictos.

## CI

Cash-X tiene CI propio. `main` ya incluye validación web (`typecheck`, tests, build) y build Android debug (Capacitor, `cap sync`, Gradle `assembleDebug`, artefacto APK).

## Trabajo paralelo

No hay PR funcional abierto ni trabajo paralelo identificado.

## Siguiente paso exacto

**Validar persistencia real de Dexie/IndexedDB dentro de Android WebView mediante emulador o dispositivo: escribir datos, cerrar/reabrir la app y comprobar integridad. Después, continuar con comprobantes y Google Drive. No construir dashboard todavía.**
