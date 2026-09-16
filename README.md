# Cash-X

Cash-X es una aplicación genérica de libro de caja para registrar ingresos, egresos, saldos y comprobantes en uno o varios libros. Puede usarse para una iglesia, negocio, hogar u otro proyecto sin tener categorías religiosas o comerciales fijas.

## Estado

- Versión estable: ninguna todavía.
- Desarrollo: pre-0.1; contrato funcional definido, implementación aún no iniciada.
- Rama principal: `main`.
- Código de aplicación: aún no iniciado.

## Principios del producto

- Offline-first: registrar y consultar movimientos sin internet.
- Datos privados fuera del repositorio público.
- Interfaz desacoplada de la lógica financiera y del almacenamiento.
- Cambios pequeños, comprobables y reversibles.
- Costos iniciales mínimos y sin servicios facturables sin aprobación.
- Sin código legacy, archivos temporales ni dependencias innecesarias.

## Alcance inicial

- Varios libros/cajas independientes.
- Ingresos y egresos.
- Saldo inicial opcional.
- Categorías configurables.
- Saldo e historial.
- Papelera con restauración.
- Cero, uno o varios comprobantes opcionales por movimiento.
- Búsqueda y filtros.
- Reportes y exportación.
- Respaldo y restauración.
- Seguridad local.

El contrato funcional aprobado está en `docs/PRODUCT_SPEC.md`.

## Tecnología actual

La base técnica heredada y aceptada como punto de partida es TypeScript + Vite. La estrategia final de PWA, persistencia local y empaquetado Android se decidirá únicamente cuando corresponda y quede documentada.

## Documentación

- `AGENT_RULES.md`: reglas obligatorias de trabajo.
- `docs/STATE.md`: estado real y siguiente paso.
- `docs/PRODUCT_SPEC.md`: contrato funcional aprobado para v0.1.
- `docs/ROADMAP.md`: checkpoints en orden.
- `docs/ARCHITECTURE.md`: límites entre capas.
- `docs/DECISIONS.md`: decisiones técnicas.
- `docs/SECURITY.md`: seguridad y privacidad.
- `docs/KNOWN_ISSUES.md`: problemas conocidos.
- `docs/SESSIONS.md`: numeración oficial de chats de trabajo.
