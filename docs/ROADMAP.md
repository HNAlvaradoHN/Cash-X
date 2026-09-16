# Roadmap de Cash-X

El orden puede cambiar si aparece nueva evidencia. Cada checkpoint se cierra antes de iniciar el siguiente.

## Checkpoint 1 — Base limpia del proyecto

**Estado: completado en Cash-X #1.**

Resultado: repositorio oficial documentado, reglas registradas, seguridad/privacidad definidas, arquitectura modular inicial establecida y ramas legacy neutralizadas sin integrarlas en Cash-X.

## Checkpoint 2 — Contrato funcional mínimo

**Estado: completado en Cash-X #1.**

Resultado aprobado:

- libros/cajas independientes;
- ingreso y egreso;
- saldo inicial opcional;
- categorías configurables;
- cálculo de saldo en dominio;
- edición de movimientos;
- Papelera con restauración y borrado definitivo confirmado;
- fechas, ordenamiento, búsqueda y filtros;
- comprobantes opcionales múltiples;
- una moneda por libro;
- reportes básicos por periodo/categoría;
- operación esencial offline;
- respaldo local manual como primera estrategia;
- PIN/biometría opcionales cuando la plataforma lo permita;
- sin login, nube obligatoria ni multiusuario en v0.1.

Contrato detallado: `docs/PRODUCT_SPEC.md`.

## Checkpoint 3 — Persistencia local y dominio

**Siguiente paso.**

Antes de programar UI:

1. definir entidades y contratos de dominio;
2. decidir almacenamiento local con criterios de integridad, migración, backup y compatibilidad PWA/Android;
3. implementar libros, categorías, movimientos, Papelera y cálculo de saldos sin depender de la UI;
4. añadir pruebas del dominio para saldo, edición, eliminación/restauración y validaciones;
5. validar migraciones y recuperación básica.

La UI será mínima y no definirá la arquitectura.

## Checkpoint 4 — Interfaz base

Construir dashboard, libros, alta/edición de movimientos, historial y filtros sobre las APIs internas ya probadas.

Validar accesibilidad y que cambiar el dashboard no afecte dominio/persistencia.

## Checkpoint 5 — PWA offline

Configurar instalación PWA, caché de recursos y comportamiento sin red sin comprometer datos privados.

## Checkpoint 6 — Android y CI

Elegir y justificar la estrategia de empaquetado Android. Configurar build reproducible en CI público sin subir claves de firma ni datos privados.

## Checkpoint 7 — Reportes, exportación y backup

Añadir exportaciones PDF/CSV/Excel y un formato de respaldo/restauración versionado y validado.

## Fuera de alcance hasta existir necesidad aprobada

- backend propio;
- sincronización multiusuario;
- cuentas en nube obligatorias;
- suscripciones;
- analítica invasiva;
- integración bancaria;
- inventario;
- IA;
- conversión automática de moneda;
- contabilidad avanzada no requerida.
