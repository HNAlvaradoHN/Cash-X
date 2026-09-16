# Decisiones técnicas

## DEC-001 — Alcance genérico de Cash-X

**Fecha:** 2026-09-16

**Decisión:** Cash-X será un libro de caja genérico. Una iglesia es un caso de uso, no una especialización del producto.

**Contexto:** Se necesita registrar dinero de una iglesia, pero la aplicación también debe servir para negocio, hogar u otros proyectos.

**Consecuencias:** categorías como diezmos, ofrendas, ventas o transporte serán configurables y no estarán codificadas como reglas fijas.

## DEC-002 — Repositorio público con datos privados fuera de Git

**Fecha:** 2026-09-16

**Decisión:** el repositorio oficial `HNAlvaradoHN/Cash-X` es público para facilitar CI en infraestructura gratuita.

**Motivo:** evitar depender de minutos privados agotables para builds, sin exponer datos reales.

**Consecuencias:** secretos, keystores, bases de datos, respaldos, comprobantes y datos personales/financieros reales están prohibidos en el repositorio y en artefactos públicos.

## DEC-003 — Offline-first

**Fecha:** 2026-09-16

**Decisión:** las operaciones principales deben funcionar sin conexión.

**Motivo:** el uso diario no debe depender de internet ni de una suscripción externa.

**Consecuencias:** la persistencia local es parte central de la arquitectura. Nube y sincronización serán opcionales y posteriores.

## DEC-004 — UI reemplazable

**Fecha:** 2026-09-16

**Decisión:** dashboard e interfaz se mantendrán desacoplados de dominio y persistencia.

**Motivo:** permitir rediseños repentinos sin reescribir cálculos, almacenamiento o servicios.

**Consecuencias:** los componentes de UI no accederán directamente a la base de datos ni contendrán reglas financieras centrales.

## DEC-005 — Base técnica inicial

**Fecha:** 2026-09-16

**Decisión:** conservar TypeScript + Vite como base técnica inicial heredada mientras se define el primer prototipo.

**Alternativas:** cambiar de stack antes de conocer requisitos reales.

**Motivo:** no existe evidencia actual que justifique migrar; cambiar tecnología ahora sería trabajo prematuro.

**Consecuencias:** PWA, persistencia y empaquetado Android se decidirán en checkpoints específicos antes de agregar dependencias.

## DEC-006 — No adoptar licencia open source todavía

**Fecha:** 2026-09-16

**Decisión:** que el repositorio sea público no implica conceder una licencia open source. No se añadirá una licencia hasta que el propietario decida cuál desea.

**Consecuencias:** no inventar ni agregar una licencia por defecto.
