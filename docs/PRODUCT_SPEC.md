# Contrato funcional mínimo de Cash-X

**Estado:** aprobado para v0.1 funcional
**Sesión:** Cash-X #1
**Fecha:** 2026-09-16

## Objetivo

Cash-X es un libro de caja genérico, offline-first y simple. Debe servir para iglesia, negocio, hogar u otros usos sin imponer categorías específicas.

## Libros / cajas

Cada libro es independiente y tiene:

- nombre;
- icono opcional;
- una moneda definida para ese libro;
- saldo inicial opcional;
- categorías propias;
- movimientos propios.

El saldo inicial no es obligatorio. Si no se define, se considera cero. Si se modifica después de existir movimientos, la interfaz debe advertir que cambiará el saldo histórico calculado.

## Movimientos

Tipos permitidos:

- ingreso;
- egreso.

Campos mínimos:

- tipo: obligatorio;
- monto: obligatorio y mayor que cero;
- fecha: obligatoria;
- hora: automática pero editable;
- categoría: obligatoria;
- concepto: obligatorio;
- nota: opcional;
- referencia/persona: opcional;
- comprobantes: opcionales, cero o varios;
- fecha de creación: automática;
- fecha de última modificación: automática.

No se debe exigir guardar datos personales para registrar un movimiento.

## Categorías

Las categorías son configurables por libro. Se pueden crear, editar, ordenar y desactivar.

Una categoría usada por movimientos existentes no debe eliminarse de forma que rompa el historial. Para nuevos registros puede quedar desactivada mientras los movimientos antiguos conservan su referencia.

## Saldo

Regla única:

`saldo = saldo inicial + ingresos - egresos`

La lógica de cálculo pertenece al dominio, nunca al dashboard ni a componentes visuales.

## Historial, búsqueda y filtros

Los movimientos se muestran inicialmente del más reciente al más antiguo.

Filtros mínimos:

- rango de fechas;
- ingreso/egreso;
- categoría;
- texto;
- rango de montos.

La búsqueda debe cubrir al menos concepto, nota y referencia cuando exista.

## Edición y eliminación

Los movimientos se pueden editar. Se conserva fecha de creación y se actualiza la fecha de última modificación.

La eliminación normal usa Papelera:

- un movimiento enviado a Papelera deja de contar en el saldo activo;
- se puede restaurar;
- el borrado definitivo requiere confirmación explícita.

## Comprobantes

Un movimiento puede tener cero, uno o varios comprobantes. No son obligatorios.

Tipos iniciales previstos:

- imágenes/fotos;
- PDF.

Los comprobantes permanecen fuera del repositorio y deben tener límites razonables de tamaño. Su almacenamiento concreto se decidirá en el checkpoint de persistencia/plataforma.

## Reportes iniciales

El producto debe poder calcular reportes por:

- día;
- mes;
- año;
- rango personalizado;
- categoría.

Cada reporte debe poder mostrar ingresos, egresos y saldo neto del periodo. La exportación PDF/CSV/Excel se implementará después del núcleo financiero.

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
- conversión automática entre monedas;
- contabilidad de partida doble.

## Contrato de UI

La UI puede cambiar completamente sin reescribir reglas de negocio, cálculo de saldos ni persistencia. El dashboard consume casos de uso del dominio y no accede directamente al almacenamiento.
