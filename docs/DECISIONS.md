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

## DEC-007 — Contrato funcional v0.1

**Fecha:** 2026-09-16

**Decisión:** el núcleo funcional v0.1 queda definido por libros independientes, movimientos de ingreso/egreso, categorías configurables, saldo calculado, historial, búsqueda/filtros, Papelera, comprobantes opcionales múltiples, reportes básicos, operación offline y respaldo local manual.

**Detalles aprobados:**

- saldo inicial permitido pero opcional; si no se define, vale cero;
- modificar saldo inicial con movimientos existentes debe advertir el impacto sobre saldos históricos;
- la eliminación normal usa Papelera y permite restaurar;
- un movimiento enviado a Papelera deja de contar en el saldo activo;
- borrado definitivo requiere confirmación explícita;
- cada movimiento puede tener cero, uno o varios comprobantes;
- los comprobantes no son obligatorios;
- una moneda por libro en v0.1;
- no habrá login ni nube obligatorios;
- sincronización multiusuario, bancos, inventario, IA y contabilidad avanzada quedan fuera de v0.1.

**Motivo:** cubrir el uso real de caja con protección contra pérdida accidental y sin complejidad prematura.

**Consecuencias:** la implementación debe respetar `docs/PRODUCT_SPEC.md` antes de elegir persistencia o construir dashboard.

## DEC-008 — Refinamientos de dominio e interacción para Checkpoint 3

**Fecha:** 2026-09-16

**Decisión:** se aprueban las siguientes reglas de producto y dominio antes de elegir persistencia:

- la interfaz usa `+ Ingreso` y `− Egreso`; `movimiento` queda como término técnico interno cuando haga falta;
- nombre y moneda son obligatorios por libro; saldo inicial, icono y color son opcionales;
- el libro puede archivarse sin pérdida de datos;
- el usuario elige un color principal y Cash-X genera una tonalidad secundaria;
- los iconos se eligen desde catálogo integrado o emoji en v0.1;
- el formulario exige monto, descripción breve, categoría y fecha; nota, referencia/persona y comprobantes quedan bajo `Más detalles`;
- la hora de creación/modificación se guarda automáticamente y no se pide como campo normal al usuario;
- cada libro puede definir un campo adicional opcional con nombre y opciones personalizadas; si no existe, no aparece en ninguna pantalla o reporte;
- toda variable visual debe estar acotada en vistas previas para no romper el diseño; el detalle muestra el contenido completo;
- todo saldo derivado se recalcula automáticamente tras cambios de monto, tipo, fecha, saldo inicial, eliminación o restauración;
- toda acción destructiva iniciada por el usuario pide confirmación;
- la Papelera conserva elementos hasta 30 días, permite restaurar y luego puede limpiar automáticamente;
- eliminar un libro envía a Papelera la unidad completa con sus datos relacionados;
- categorías y opciones históricamente usadas pueden retirarse de uso sin romper registros anteriores: dejan de ofrecerse para nuevos registros y el historial conserva su valor;
- si un campo existe pero un registro no tiene valor, las vistas tabulares/reportes pueden mostrar `—` para distinguir vacío de ausencia del campo.

**Motivo:** proteger integridad histórica, reducir fricción en captura de datos y evitar que decisiones visuales fuercen una arquitectura incorrecta.

**Consecuencias:** la persistencia debe soportar referencias históricas, borrado lógico/retención, restauración de agregados completos y recálculo determinista del saldo.

## DEC-009 — Dirección funcional de reportes detallados

**Fecha:** 2026-09-16

**Decisión:** cada reporte v0.1 corresponde a un solo libro y debe permitir reconstruir las cuentas del periodo.

**Detalles aprobados:**

- periodos visibles: semana, mes, año y rango personalizado;
- resumen superior con saldo inicial del periodo, ingresos, egresos, saldo final y cantidad de registros;
- detalle cronológico combinado con saldo acumulado después de cada registro;
- el saldo de apertura de un periodo se calcula usando todo el historial activo anterior;
- resumen por categorías al final;
- campo adicional solo aparece si fue configurado para ese libro;
- `Incluir comprobantes` activado por defecto al generar PDF;
- el PDF debe mantenerse limpio y evitar anexar fotografías gigantes como páginas finales;
- se evaluará adjuntar/integrar comprobantes al PDF y se probará compatibilidad real entre lectores antes de prometer ese comportamiento.

**Motivo:** facilitar revisión y auditoría sin sacrificar legibilidad.

**Consecuencias:** la implementación de reportes se mantiene para un checkpoint posterior; primero se construirá y probará el núcleo financiero.

## DEC-010 — Entrada de monto con calculadora integrada y precisión financiera

**Fecha:** 2026-09-16

**Decisión:** el campo de monto de ingreso/egreso permitirá escribir operaciones aritméticas simples antes de guardar el valor final. Por ejemplo, el usuario podrá introducir `200 + 100` y Cash-X resolverá automáticamente `300`.

**Comportamiento aprobado:**

- la experiencia puede usar un teclado/calculadora similar al mostrado como referencia, integrado al ingreso del monto;
- debe soportar al menos suma, resta, multiplicación y división, además de decimales;
- el usuario puede componer una operación y confirmar el resultado sin tener que calcularlo fuera de Cash-X;
- solo se guarda el monto final resultante como valor financiero del registro; la expresión de cálculo no es necesaria para el historial salvo futura decisión explícita;
- el resultado debe ser determinista y exacto para dinero: no se aceptan errores de punto flotante visibles ni acumulación de centavos incorrectos;
- se validan división por cero, expresiones incompletas, resultados inválidos y montos no permitidos antes de guardar;
- las decisiones técnicas de representación numérica y redondeo son responsabilidad de la implementación y no deben trasladarse al usuario como preguntas de configuración ordinarias.

**Motivo:** agilizar la captura de montos compuestos y mantener precisión financiera sin obligar al usuario a usar una calculadora externa.

**Consecuencias:** el dominio debe recibir un monto monetario ya validado y normalizado; la UI de calculadora no debe convertirse en la fuente de verdad del cálculo financiero ni introducir aritmética binaria imprecisa.

## DEC-011 — Una base de código PWA/Android con Dexie + IndexedDB y Capacitor

**Fecha:** 2026-09-16

**Decisión:** Cash-X v0.1 mantendrá una sola base de código TypeScript + Vite. La web se entregará como PWA y Android se empaquetará con Capacitor. Los datos estructurados usarán IndexedDB mediante Dexie tanto en PWA como dentro del runtime Android de Capacitor.

**Detalles:**

- no se implementarán dos motores de base de datos en v0.1;
- UI y dominio no accederán directamente a Dexie; usarán contratos de repositorio;
- las operaciones relacionadas que deban ser atómicas usarán transacciones;
- las migraciones de esquema serán versionadas y probadas;
- la PWA solicitará almacenamiento persistente cuando el navegador lo permita, pero backup seguirá siendo obligatorio;
- los comprobantes usan una abstracción separada; el primer adaptador puede guardar `Blob` en un almacén dedicado de IndexedDB y cambiar a OPFS/sistema de archivos nativo si las pruebas de tamaño o rendimiento lo justifican;
- PWA y APK son instalaciones con almacenamiento separado; en v0.1 la transferencia de datos entre ambas se hará mediante backup/restauración versionado;
- SQLite no se adopta inicialmente y solo se reconsiderará por evidencia concreta de rendimiento, cifrado, interoperabilidad o confiabilidad.

**Alternativas evaluadas:**

- IndexedDB/Dexie en PWA + SQLite nativo en Android: rechazado inicialmente por duplicar adaptadores, migraciones y pruebas;
- SQLite WASM + OPFS en web: rechazado inicialmente por complejidad adicional sin necesidad demostrada;
- una capa SQLite comunitaria como dependencia central: válida técnicamente, pero innecesaria para el alcance v0.1 y con mayor superficie de mantenimiento.

**Motivo:** maximizar integridad, simplicidad y mantenibilidad con una sola implementación local mientras se conserva una salida limpia a SQLite futuro detrás de contratos de persistencia.

**Consecuencias:** antes de implementar el núcleo financiero se hará un spike que valide migraciones, transacciones, Papelera/restauración, comprobantes, backup y ejecución real tanto en PWA como en Android mediante Capacitor. Detalles: `docs/PERSISTENCE.md`.
