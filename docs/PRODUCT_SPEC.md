# Contrato funcional mínimo de Cash-X

**Estado:** aprobado para v0.1 funcional; refinamientos de Checkpoint 3 en curso  
**Sesión:** Cash-X #1  
**Fecha:** 2026-09-16

## Objetivo

Cash-X es un libro de caja genérico, offline-first y simple. Debe servir para iglesia, negocio, hogar u otros usos sin imponer categorías específicas.

La regla de producto es simple: el usuario registra los datos necesarios y Cash-X calcula automáticamente todo valor derivado.

## Terminología de interfaz

El modelo interno puede usar el concepto técnico de movimiento, pero la interfaz principal no debe obligar al usuario a entender ese término.

Acciones principales visibles:

- `+ Ingreso`;
- `− Egreso`.

## Libros / cajas

Cada libro es independiente y tiene:

- nombre obligatorio;
- una moneda obligatoria y única para ese libro;
- saldo inicial opcional;
- icono opcional;
- color/portada opcional;
- categorías propias;
- campo adicional configurable opcional;
- ingresos y egresos propios;
- estado activo o archivado;
- fechas internas automáticas de creación y última modificación.

El saldo inicial no es obligatorio. Si no se define, se considera cero. Si se modifica después de existir registros, la interfaz debe advertir que cambiará el saldo histórico calculado.

### Icono y color

Para v0.1:

- el icono se elige desde un catálogo integrado o mediante emoji;
- no se requiere imagen/logo personalizado;
- el usuario elige un color principal;
- Cash-X genera automáticamente una tonalidad secundaria compatible;
- no se obliga al usuario a configurar dos colores manualmente.

### Archivar libro

Archivar no elimina datos. Un libro archivado deja de mostrarse en la vista principal, conserva toda su información y puede restaurarse a estado activo.

## Ingresos y egresos

Tipos permitidos:

- ingreso;
- egreso.

Campos mínimos:

- tipo: obligatorio;
- monto: obligatorio y mayor que cero;
- descripción/concepto: obligatoria y breve;
- categoría principal: obligatoria;
- fecha: obligatoria, inicializada con la fecha actual pero completamente editable;
- campo adicional: opcional y visible solo si fue configurado para el libro;
- nota: opcional;
- referencia/persona: opcional;
- comprobantes: opcionales, cero, uno o varios;
- fecha/hora real de creación: automática e interna;
- fecha/hora de última modificación: automática e interna.

La hora no se pedirá como campo normal al usuario. Cash-X conserva internamente los timestamps reales de creación y modificación.

No se debe exigir guardar datos personales para registrar un ingreso o egreso.

### Formulario base

La vista principal del formulario muestra monto, descripción, categoría, fecha y, cuando exista, el campo adicional configurado.

`Más detalles` permanece cerrado por defecto y contiene:

- nota;
- referencia/persona;
- comprobantes.

Los datos opcionales ya guardados nunca se pierden por estar visualmente contraídos.

### Entrada de monto con calculadora

El campo `Monto` debe aceptar tanto un valor directo como una operación aritmética simple. El usuario podrá, por ejemplo, escribir `200 + 100` y Cash-X mostrará/resolverá `300` antes de guardar.

La experiencia de entrada puede usar un teclado/calculadora integrado similar a una calculadora básica, con soporte inicial para:

- suma;
- resta;
- multiplicación;
- división;
- decimales;
- borrar/corregir;
- confirmar resultado.

Solo el resultado monetario final se guarda como monto del ingreso o egreso. La expresión usada para calcularlo no forma parte obligatoria del historial.

Los cálculos monetarios deben ser deterministas y exactos. La implementación no debe depender de aritmética binaria de punto flotante que produzca errores visibles o acumulación incorrecta de centavos. Se validan expresiones incompletas, división por cero, resultados inválidos y montos no permitidos antes de guardar.

La selección de representación numérica, precisión y estrategia de redondeo es una decisión técnica interna: el usuario no debe ser interrogado por configuraciones ordinarias de precisión financiera.

## Categorías

Las categorías son configurables por libro. Se pueden crear, editar y ordenar.

### Eliminación de categorías

Toda eliminación iniciada por el usuario requiere confirmación previa.

Si una categoría nunca fue usada, puede eliminarse después de confirmar.

Si una categoría ya fue usada:

- Cash-X advierte cuántos registros la utilizan;
- si el usuario confirma, deja de estar disponible para registros nuevos;
- los registros históricos siguen mostrando normalmente el nombre de esa categoría;
- al editar un registro histórico no se obliga a reemplazarla;
- si el usuario decide cambiarla, el selector ofrece únicamente categorías actualmente disponibles.

La implementación debe preservar internamente la referencia histórica aunque la interfaz trate la categoría como eliminada.

## Campo adicional configurable

Cada libro puede tener como máximo el campo adicional previsto para v0.1. Es opcional y no aparece si el usuario no lo configura.

El usuario define:

- el nombre visible del campo, por ejemplo `Actividad`, `Sucursal` o `Proyecto`;
- las opciones seleccionables de ese campo.

Ejemplo:

- nombre: `Actividad`;
- opciones: `Culto dominical`, `Culto de jóvenes`, `Misiones`.

Las opciones del campo adicional siguen la misma regla general de integridad que las categorías: si una opción usada se retira, los registros históricos conservan el valor y la opción deja de ofrecerse para registros nuevos.

Si el campo adicional no existe en un libro, no aparece en formulario, historial, detalle ni reportes.

Si el campo existe pero un registro no tiene valor, las vistas tabulares o reportes que muestren ese campo utilizan `—` para indicar valor vacío.

## Saldo y recálculo automático

Regla única:

`saldo = saldo inicial + ingresos - egresos`

La lógica de cálculo pertenece al dominio, nunca al dashboard ni a componentes visuales.

Cash-X recalcula automáticamente los saldos afectados cuando se modifica información con impacto financiero o cronológico, incluyendo:

- monto;
- tipo ingreso/egreso;
- fecha;
- saldo inicial;
- envío a Papelera;
- restauración;
- eliminación definitiva cuando corresponda.

El usuario nunca corrige saldos derivados manualmente.

## Historial, búsqueda, filtros y detalle

Los registros se muestran inicialmente del más reciente al más antiguo y pueden agruparse por fecha.

En listas y vistas previas, todo contenido variable debe tener límites visuales para no romper el diseño. Esto incluye descripción, categoría, campo adicional, nota, referencia y otros textos configurables. La vista de detalle permite consultar el contenido completo y puede usar `Ver más / Ver menos` cuando sea necesario.

Filtros mínimos:

- rango de fechas;
- ingreso/egreso;
- categoría;
- texto;
- rango de montos.

La búsqueda debe cubrir al menos descripción, nota y referencia cuando exista.

Al abrir un registro se muestra su detalle completo y se permiten las acciones correspondientes de edición y eliminación.

## Eliminación, Papelera y restauración

### Regla general de confirmación

Toda acción destructiva iniciada por el usuario debe pedir confirmación antes de ejecutarse.

La eliminación normal envía a Papelera y no destruye inmediatamente los datos.

### Retención

Los elementos permanecen en Papelera como máximo 30 días.

Mientras estén en Papelera:

- pueden restaurarse;
- muestran el tiempo restante antes de su eliminación automática;
- pueden eliminarse definitivamente de forma manual, siempre con una nueva confirmación explícita.

Al cumplirse los 30 días, Cash-X puede realizar la limpieza automática sin una nueva pregunta porque el usuario ya confirmó el envío inicial a Papelera y se le informó la retención.

### Registros individuales

Un ingreso o egreso enviado a Papelera deja de contar en el saldo activo. Al restaurarlo, vuelve a contar y los saldos afectados se recalculan automáticamente.

### Libros completos

Eliminar un libro envía el libro completo a Papelera como una sola unidad lógica junto con sus datos relacionados, incluyendo:

- ingresos y egresos;
- categorías;
- campo adicional y sus opciones;
- notas y referencias;
- comprobantes;
- configuración propia del libro.

Restaurar el libro recupera la unidad completa conservando sus relaciones.

## Comprobantes

Un ingreso o egreso puede tener cero, uno o varios comprobantes. No son obligatorios.

Tipos iniciales previstos:

- imágenes/fotos;
- PDF.

Los comprobantes permanecen fuera del repositorio y deben tener límites razonables de tamaño. Su almacenamiento concreto se decidirá en el checkpoint de persistencia/plataforma.

## Reportes iniciales

La exportación avanzada se implementará después del núcleo financiero, pero el comportamiento de producto aprobado es el siguiente.

### Alcance

Cada reporte corresponde a un solo libro. No se combinan varios libros en un mismo reporte en v0.1.

Periodos visibles previstos:

- semana;
- mes;
- año;
- rango personalizado.

### Contenido

El reporte debe permitir que otra persona reconstruya las cuentas y verifique los totales.

Incluye al inicio:

- saldo al inicio del periodo;
- total de ingresos;
- total de egresos;
- saldo final;
- cantidad de registros.

El saldo de apertura de un periodo intermedio se calcula usando el saldo inicial del libro y todos los registros activos anteriores al inicio del periodo.

El detalle principal es un libro mayor cronológico combinado, no dos listas separadas, con información equivalente a:

`Fecha | Descripción | Categoría | Campo adicional si existe | Ingreso | Egreso | Saldo`

Cada fila muestra el saldo acumulado después de ese registro.

Al final se muestran totales y una verificación matemática equivalente a:

`saldo inicial del periodo + ingresos - egresos = saldo final`.

También se incluye un resumen por categorías para ingresos y egresos.

Cuando un campo incluido en el reporte existe pero un registro concreto no tiene valor, se muestra `—` para dejar claro que el valor está vacío. Si el campo adicional no fue configurado para el libro, no aparece ninguna columna o sección para él.

### Comprobantes en PDF

`Incluir comprobantes` estará activado por defecto al generar el reporte.

El objetivo visual es mantener el PDF limpio: los comprobantes no deben añadirse como fotografías gigantes al final. Se evaluará integrar/adjuntar archivos al PDF y representarlos mediante un indicador en la fila correspondiente.

La compatibilidad de archivos adjuntos dentro de PDF varía entre lectores, especialmente en Android. Antes de implementar esta parte se debe probar soporte real y definir un fallback sin ensuciar el reporte. No se promete compatibilidad universal hasta realizar esa validación.

## Offline y respaldo

Las operaciones esenciales deben funcionar sin internet:

- crear;
- editar;
- eliminar/restaurar;
- consultar;
- buscar/filtrar;
- visualizar comprobantes locales.

El primer respaldo será manual y local. Sincronización cloud y multiusuario quedan fuera de v0.1 salvo nueva decisión aprobada.

## Seguridad local

Previsto para v0.1:

- PIN opcional;
- bloqueo automático configurable;
- biometría cuando la plataforma lo permita;
- sin telemetría invasiva;
- sin login obligatorio ni cuenta cloud.

## Fuera de alcance de v0.1

- sincronización entre dispositivos;
- multiusuario concurrente;
- integración bancaria;
- facturación electrónica;
- inventario;
- préstamos/cuentas por cobrar;
- IA;
- conversión automática de moneda;
- contabilidad de partida doble;
- agrupaciones tipo libro compartido/split book;
- presupuestos y metas como funciones centrales;
- imágenes/logos personalizados para cada libro.

## Contrato de UI

La UI puede cambiar completamente sin reescribir reglas de negocio, cálculo de saldos ni persistencia. El dashboard consume casos de uso del dominio y no accede directamente al almacenamiento.
