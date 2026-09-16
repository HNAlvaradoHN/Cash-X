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
- PR activo: #17 `ci(android): validate generated Capacitor build`.
- Issue #16 asociado al spike Android permanece abierto hasta integrar PR #17.
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

**Generación y build debug validados en CI; runtime WebView todavía pendiente.**

PR #17 amplía CI para:

- generar `android/` temporalmente con Capacitor;
- sincronizar los assets web;
- compilar `assembleDebug` con JDK 21;
- producir y subir un APK debug como artefacto temporal.

El primer intento detectó una incompatibilidad real: Capacitor no pudo cargar `capacitor.config.ts` con TypeScript 7.0.2 en Node 22.12.0. Se corrigió la causa usando `capacitor.config.json`, evitando depender del loader TypeScript de Capacitor. Tras el cambio, `verify` y `android-build` terminaron correctamente, incluyendo generación Android, `cap sync`, Gradle y artefacto APK.

Esto valida el **build Android**, no la ejecución en un emulador/teléfono ni IndexedDB dentro de WebView.

### Pendiente del spike

- ejecutar Cash-X dentro de WebView Android real/emulado y validar persistencia/reapertura;
- probar comprobantes binarios y límites reales;
- probar cleanup y recuperación ante fallos más agresivos;
- generar `package-lock.json` para instalaciones reproducibles;
- implementar y probar Google OAuth/Drive;
- probar dos instalaciones, offline/reconexión, idempotencia y conflictos.

## CI

Cash-X tiene CI propio. En PR #17 pasan tanto el job web (`typecheck`, tests, build) como el job Android (generación Capacitor, sync, Gradle `assembleDebug`, artefacto APK).

## Trabajo paralelo

No hay otro PR funcional abierto identificado.

## Siguiente paso exacto

**Integrar PR #17 con CI verde y después validar persistencia real de Dexie/IndexedDB dentro de WebView Android mediante emulador o dispositivo. No construir dashboard todavía.**
