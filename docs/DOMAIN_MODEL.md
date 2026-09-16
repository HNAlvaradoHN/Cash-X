# Modelo de dominio de Cash-X

**Estado:** contrato técnico inicial de Checkpoint 3  
**Sesión:** Cash-X #1  
**Fecha:** 2026-09-16

## Objetivo

Traducir el contrato funcional aprobado a entidades, invariantes y contratos internos antes de elegir la tecnología de persistencia. Este documento describe el modelo lógico; no obliga a una base de datos, librería o diseño visual concretos.

## Principios

- La UI nunca es la fuente de verdad financiera.
- Los saldos se derivan de datos persistidos; no se editan manualmente.
- El dinero se representa de forma exacta y portable, sin depender de `number` binario para cálculos financieros.
- La fecha del registro financiero y los timestamps técnicos son conceptos distintos.
- La Papelera es un estado lógico con retención, no una copia duplicada de los datos.
- Los comprobantes binarios se separan del almacenamiento estructurado.
- Las referencias históricas deben sobrevivir a la eliminación de categorías u opciones configurables.

## Mapa conceptual

```text
Libro
├─ Categorías
├─ Campo adicional opcional
│  └─ Opciones
└─ Registros financieros
   ├─ Ingreso o egreso
   ├─ Categoría
   ├─ Opción adicional opcional
   └─ Comprobantes 0..n
```

## Dinero

El valor monetario canónico se guarda como **unidades menores enteras**, no como punto flotante. Para mantener compatibilidad entre JSON, IndexedDB, SQLite y formatos de respaldo, el valor persistido se expresa como cadena decimal entera.

Ejemplo para Lempiras con 2 decimales:

```text
L 1,500.25  -> minorUnits = "150025"
L 0.10      -> minorUnits = "10"
```

Cada libro conserva:

- `currencyCode`: código de moneda;
- `currencyScale`: cantidad de decimales de esa moneda;
- `initialBalanceMinorUnits`: saldo inicial en unidades menores, permitiendo cero y valores firmados cuando corresponda.

Cada registro financiero conserva un `amountMinorUnits` estrictamente mayor que cero. El signo financiero no se guarda en el monto: lo determina `type = income | expense`.

La calculadora de monto trabaja con aritmética decimal exacta. No se redondea durante pasos intermedios; el resultado final se normaliza a la escala de la moneda antes de guardar y se muestra al usuario antes de confirmar. La regla inicial de normalización será redondeo decimal `half-up`, codificada y probada en dominio.

Una vez que un libro contiene registros financieros, su moneda no puede cambiarse como una simple edición porque reinterpretaría importes históricos. Un cambio de moneda posterior requeriría una migración/conversión explícita, función fuera de v0.1.

## Fechas y orden determinista

Cada registro tiene dos clases de fecha:

- `occurredOn`: fecha de negocio elegida por el usuario, almacenada como fecha civil `YYYY-MM-DD` sin zona horaria;
- `createdAt` y `updatedAt`: instantes técnicos automáticos almacenados en UTC.

La hora técnica no se solicita en el formulario normal.

Para cálculos históricos y reportes, el orden ascendente estable es:

1. `occurredOn`;
2. `createdAt`;
3. `id` como desempate final.

La vista de historial puede invertir ese orden para mostrar lo más reciente primero sin cambiar la lógica financiera.

## Identificadores

Todas las entidades persistentes usan identificadores opacos, únicos y generados localmente. La implementación concreta puede usar UUID/ULID u otra opción equivalente siempre que sea estable, portable y no dependa de conexión a internet.

Los identificadores nunca contienen datos personales ni información financiera legible.

## Entidad Libro

Campos lógicos mínimos:

- `id`;
- `name`;
- `currencyCode`;
- `currencyScale`;
- `initialBalanceMinorUnits`;
- `icon` opcional;
- `primaryColor` opcional;
- `status = active | archived`;
- `createdAt`;
- `updatedAt`;
- `deletedAt` opcional;
- `purgeAfter` opcional.

Reglas:

- nombre y moneda son obligatorios;
- cada registro, categoría, campo adicional y comprobante pertenece a un solo libro;
- archivar no equivale a eliminar;
- eliminar un libro coloca el agregado completo en Papelera;
- restaurar el libro devuelve el agregado sin perder relaciones internas.

La eliminación del libro no sobrescribe el estado de Papelera que pudiera tener previamente un hijo individual. Al restaurar el libro, un registro que ya estaba en Papelera antes de borrar el libro continúa en Papelera.

## Entidad Registro financiero

Representa internamente un ingreso o egreso. Campos lógicos mínimos:

- `id`;
- `bookId`;
- `type = income | expense`;
- `amountMinorUnits`;
- `description`;
- `occurredOn`;
- `categoryId`;
- `categoryNameFallback`;
- `customOptionId` opcional;
- `customFieldLabelFallback` opcional;
- `customOptionValueFallback` opcional;
- `note` opcional;
- `reference` opcional;
- `createdAt`;
- `updatedAt`;
- `deletedAt` opcional;
- `purgeAfter` opcional.

Reglas:

- monto mayor que cero;
- categoría obligatoria y del mismo libro;
- opción adicional, cuando exista, debe pertenecer al campo adicional del mismo libro;
- un registro en Papelera no participa en saldo activo;
- restaurarlo lo vuelve a incluir automáticamente;
- la descripción y fecha de negocio son obligatorias.

Los campos `Fallback` preservan únicamente el texto necesario para mostrar el historial si la categoría u opción referenciada llega a ser purgada físicamente. Mientras la referencia exista, el nombre vivo de la entidad es la fuente normal de presentación. Si se renombra una categoría/opción, sus fallbacks asociados se mantienen coherentes dentro de la misma operación lógica.

## Entidad Categoría

Campos lógicos mínimos:

- `id`;
- `bookId`;
- `name`;
- `sortOrder`;
- `createdAt`;
- `updatedAt`;
- `deletedAt` opcional;
- `purgeAfter` opcional.

Solo categorías activas se ofrecen para registros nuevos. Una categoría eliminada puede seguir apareciendo en registros históricos mediante su referencia mientras exista y, después de la purga, mediante el fallback del registro.

## Campo adicional y opciones

Para v0.1 cada libro admite como máximo una definición de campo adicional.

### Definición

- `id`;
- `bookId`;
- `label`;
- `createdAt`;
- `updatedAt`;
- `deletedAt` opcional;
- `purgeAfter` opcional.

### Opción

- `id`;
- `customFieldId`;
- `value`;
- `sortOrder`;
- `createdAt`;
- `updatedAt`;
- `deletedAt` opcional;
- `purgeAfter` opcional.

Si la definición no existe o está eliminada, el campo no aparece para nuevos registros. Las referencias históricas conservan su representación mediante los fallbacks del registro.

## Comprobantes

La base estructurada guarda metadatos; el archivo binario vive en almacenamiento de archivos adecuado para la plataforma.

Metadatos mínimos:

- `id`;
- `entryId`;
- `kind = image | pdf`;
- `mimeType`;
- `originalName` opcional;
- `byteSize`;
- `storageKey` opaco;
- `sha256` opcional para verificación de integridad;
- `createdAt`.

Reglas:

- cero, uno o varios por registro;
- nunca se guarda la ruta privada absoluta del dispositivo como contrato de dominio;
- borrar definitivamente un registro también elimina sus archivos físicos asociados mediante cleanup controlado;
- la restauración antes de la purga conserva los comprobantes;
- archivos huérfanos deben detectarse y limpiarse de forma segura.

## Papelera y retención

La Papelera no duplica objetos. Un elemento eliminado conserva su identidad y recibe:

- `deletedAt`;
- `purgeAfter = deletedAt + 30 días`.

Hasta `purgeAfter` puede restaurarse. La restauración limpia ambos campos. La purga física elimina solo después de expirar la retención o de una eliminación definitiva confirmada.

En el caso de un libro, `deletedAt` en el libro hace que todo el agregado quede fuera de consultas activas sin necesidad de marcar uno por uno todos sus hijos. Esto permite restauración coherente y evita perder estados previos de sus hijos.

## Saldo

La fuente de verdad es:

```text
saldo = saldo inicial + suma(ingresos activos) - suma(egresos activos)
```

El saldo actual y los saldos acumulados históricos se calculan desde registros activos ordenados de forma determinista.

No se guarda un saldo editable como verdad primaria. Una implementación futura puede mantener cachés/materializaciones por rendimiento, pero deben ser reconstruibles totalmente desde los datos fuente y nunca reemplazar la fórmula de dominio.

## Contratos de dominio

La capa de dominio expondrá casos de uso y contratos independientes de la UI y de la base concreta. Como mínimo:

- crear/editar/archivar/eliminar/restaurar libro;
- crear/editar/eliminar/restaurar ingreso o egreso;
- crear/editar/ordenar/eliminar/restaurar categoría;
- configurar/eliminar/restaurar campo adicional y opciones;
- agregar/eliminar/consultar comprobantes;
- evaluar y normalizar una expresión de monto;
- calcular saldo actual;
- calcular saldo de apertura para una fecha/rango;
- obtener libro mayor ordenado y saldos acumulados;
- listar elementos de Papelera y ejecutar purga vencida.

Los repositorios de persistencia se consumen mediante interfaces del dominio/aplicación. Ningún componente visual accederá directamente al almacenamiento.

## Invariantes que deben probarse

- no existen errores visibles de punto flotante;
- ningún registro usa categoría de otro libro;
- ninguna opción adicional pertenece a otro libro;
- cambiar fecha/monto/tipo recalcula correctamente los saldos posteriores;
- Papelera excluye registros del saldo y restauración los reincorpora;
- borrar/restaurar un libro conserva relaciones y estados previos de hijos;
- una referencia histórica sigue mostrándose aunque su categoría/opción sea purgada;
- orden histórico es estable aun con varios registros el mismo día;
- comprobantes no quedan huérfanos tras purga definitiva;
- cualquier caché de saldo puede reconstruirse desde la fuente de verdad.

## Pendiente siguiente

Con este modelo lógico definido, el siguiente paso de Checkpoint 3 es comparar opciones concretas de persistencia local para PWA + Android y escoger la que mejor cumpla integridad, migraciones, backup, archivos, compatibilidad y costo antes de escribir el núcleo financiero.
