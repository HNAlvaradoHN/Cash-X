# Cash-X

Cash-X es una aplicación genérica de libro de caja para registrar ingresos, egresos, saldos y comprobantes en uno o varios libros. Puede usarse para una iglesia, negocio, hogar u otro proyecto sin categorías fijas.

## Estado

- Versión estable: ninguna todavía.
- Desarrollo: pre-0.1.
- Rama principal: `main`.
- Contrato funcional y modelo de dominio: definidos.
- Persistencia local: primer spike Dexie/IndexedDB implementado y validado por CI en PR #14.
- Android nativo/Capacitor en dispositivo: pendiente de validación práctica.
- Sincronización Google Drive: arquitectura definida, implementación pendiente.
- UI final: no iniciada.

## Principios del producto

- Offline-first: registrar y consultar sin depender de internet.
- Datos privados fuera del repositorio público.
- Interfaz desacoplada de lógica financiera, persistencia y sincronización.
- Cambios pequeños, comprobables y reversibles.
- Costos iniciales mínimos y sin servicios facturables sin aprobación.
- Sin código legacy, archivos temporales ni dependencias innecesarias.

## Tecnología actual

- TypeScript + Vite.
- IndexedDB mediante Dexie para persistencia estructurada local.
- Capacitor como estrategia Android.
- Google Drive como única nube opcional inicial para sincronización, sin backend propio de Cash-X.

Las dependencias directas están fijadas a versiones exactas. Falta incorporar `package-lock.json` antes de considerar la base reproducible para release.

## Comandos del spike

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Documentación

- `AGENT_RULES.md`: reglas obligatorias de trabajo.
- `docs/STATE.md`: estado real y siguiente paso.
- `docs/PRODUCT_SPEC.md`: contrato funcional aprobado.
- `docs/DOMAIN_MODEL.md`: modelo lógico e invariantes.
- `docs/PERSISTENCE.md`: persistencia y plataforma.
- `docs/SYNC.md`: sincronización opcional con Google Drive.
- `docs/ROADMAP.md`: checkpoints.
- `docs/ARCHITECTURE.md`: límites entre capas.
- `docs/DECISIONS.md`: decisiones técnicas.
- `docs/SECURITY.md`: seguridad y privacidad.
- `docs/KNOWN_ISSUES.md`: problemas conocidos.
- `docs/SESSIONS.md`: numeración oficial de chats.
