# Roadmap de Cash-X

El orden puede cambiar si aparece nueva evidencia. Cada checkpoint se cierra antes de iniciar el siguiente.

## Checkpoint 1 — Base limpia del proyecto

**Estado: completado en Cash-X #1.**

Resultado: repositorio oficial documentado, reglas registradas, seguridad/privacidad definidas, arquitectura modular inicial establecida y ramas legacy neutralizadas sin integrarlas en Cash-X.

## Checkpoint 2 — Contrato funcional mínimo

**Siguiente paso.**

Definir antes de programar:

- qué es un libro/caja;
- ingreso y egreso;
- campos obligatorios/opcionales;
- categorías configurables;
- cálculo de saldo;
- edición y eliminación;
- fechas y ordenamiento;
- búsqueda/filtros;
- comprobantes y límites;
- moneda por libro;
- reglas de validación.

Salida esperada: comportamiento definido y casos de prueba principales, sin elegir todavía servicios innecesarios.

## Checkpoint 3 — Persistencia local y dominio

Implementar el modelo mínimo y almacenamiento offline con migraciones, integridad y pruebas. La UI será mínima y no definirá la arquitectura.

## Checkpoint 4 — Interfaz base

Construir dashboard, libros, alta/edición de movimientos, historial y filtros sobre las APIs internas ya probadas.

Validar accesibilidad y que cambiar el dashboard no afecte dominio/persistencia.

## Checkpoint 5 — PWA offline

Configurar instalación PWA, caché de recursos y comportamiento sin red sin comprometer datos privados.

## Checkpoint 6 — Android y CI

Elegir y justificar la estrategia de empaquetado Android. Configurar build reproducible en CI público sin subir claves de firma ni datos privados.

## Checkpoint 7 — Reportes, exportación y backup

Añadir reportes/exportaciones y un formato de respaldo/restauración versionado y validado.

## Fuera de alcance hasta existir necesidad aprobada

- backend propio;
- sincronización multiusuario;
- cuentas en nube obligatorias;
- suscripciones;
- analítica invasiva;
- funciones contables avanzadas no requeridas.
