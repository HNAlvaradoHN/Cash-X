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
- PR #18 `docs(state): close Android build spike`: integrado.
- PR #20 `test(android): validate WebView IndexedDB persistence`: integrado.
- Issue #19 `Checkpoint 3 spike: validate IndexedDB persistence in Android WebView`: cerrado como completado por PR #20.
- PR funcional activo después de integrar PR #20: ninguno.
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

### Android — build y persistencia WebView

**Build debug y persistencia Dexie/IndexedDB validados en CI con Android emulado.**

PR #17 validó generación temporal de `android/`, `cap sync`, Gradle `assembleDebug` y creación de APK debug.

PR #20 añadió un probe técnico aislado que usa las implementaciones reales `CashXDatabase` y `LocalPersistence`. En un emulador Android API 35 el CI:

- instaló el APK de prueba;
- en el primer arranque escribió y volvió a leer un libro de prueba en Dexie/IndexedDB;
- forzó el cierre de `com.cashx.app`;
- abrió nuevamente la aplicación en un segundo arranque frío;
- volvió a leer el mismo libro y comprobó identificador, nombre, moneda, saldo inicial, estado y ausencia de borrado.

El job `android-build` completo terminó correctamente, incluyendo la comprobación `Verify IndexedDB survives Android app restart`.

Esto demuestra persistencia real dentro de Android WebView en emulador. **Todavía no equivale a una prueba en dispositivo físico ni a una aplicación lista para uso financiero real.**

Durante el spike se corrigieron dos problemas de infraestructura sin alterar dominio ni persistencia: exposición de `adb` en `PATH` y uso explícito de `ANDROID_AVD_HOME` para que `avdmanager` y el emulador resolvieran el mismo AVD.

### Pendiente del spike

- probar comprobantes binarios (`Blob`) y límites reales;
- validar eliminación/cleanup de comprobantes y recuperación ante fallos más agresivos;
- generar `package-lock.json` para instalaciones reproducibles;
- validar backup/restauración entre instalaciones de prueba;
- implementar y probar Google OAuth/Drive;
- probar dos instalaciones, offline/reconexión, idempotencia y conflictos;
- realizar prueba física Android antes de considerar una entrega real.

## CI

Cash-X tiene CI propio. `main` valida typecheck, tests, build web, generación/build Android debug y persistencia IndexedDB/Dexie tras cierre forzado y reapertura en un emulador Android API 35.

## Trabajo paralelo

No hay PR funcional abierto ni trabajo paralelo identificado después de integrar PR #20.

## Siguiente paso exacto

**Validar comprobantes binarios detrás de `AttachmentStore`: guardar, leer y eliminar `Blob` de tamaños de prueba, comprobar cleanup y fallos de escritura sin afectar registros financieros. Después incorporar el lockfile reproducible y continuar con Google Drive. No construir dashboard todavía.**
