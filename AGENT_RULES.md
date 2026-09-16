# Reglas obligatorias de Cash-X

Estas reglas son la referencia operativa para cualquier chat, agente o colaborador que trabaje en Cash-X.

## 1. Fuente de verdad

El repositorio es la fuente técnica principal. Antes de modificar algo, revisar el estado real de `main`, ramas activas, PR, commits, CI, código relacionado, documentación, decisiones, problemas conocidos y roadmap. No reconstruir el estado desde memoria o suposiciones.

Si documentación e implementación se contradicen, investigar cuál refleja la realidad antes de escribir.

## 2. Inicio de cada chat de trabajo

Antes de cualquier cambio:

1. verificar repositorio oficial y rama principal;
2. leer estas reglas y la documentación principal;
3. revisar ramas, PR abiertos y recientes, commits y CI;
4. revisar código relacionado y trabajo paralelo;
5. identificar versión estable, versión en desarrollo, problemas y siguiente paso real;
6. verificar el último número en `docs/SESSIONS.md`;
7. registrar el nuevo número antes de anunciarlo.

Hasta completar esta verificación no se crean ramas, commits, PR ni cambios de estado.

Formato obligatorio después de registrar la sesión:

`Ing. Cash-X #N 💵`

El número permanece fijo durante todo ese chat.

## 3. Trabajo por checkpoints

Cada etapa debe tener objetivo, alcance, exclusiones, implementación, pruebas, resultado, documentación, commit/PR cuando corresponda y siguiente paso. No adelantar fases ni construir todo de golpe.

Algo solo está terminado cuando sus validaciones relevantes pasan y la documentación refleja el estado real. Si falta validación, usar `Implementado, pendiente de validación`.

## 4. Cambios pequeños y causa real

Antes de modificar:

- entender cómo funciona actualmente;
- revisar dependencias y trabajo paralelo;
- encontrar la necesidad o causa real;
- definir el cambio mínimo;
- probarlo y revisar efectos relacionados.

No hacer refactors oportunistas ni parches sobre parches. Para errores: reproducir → identificar causa → corregir causa → probar → comprobar regresiones.

## 5. Arquitectura y aislamiento

Separar interfaz, lógica de negocio, persistencia, archivos/comprobantes, exportación/respaldo, seguridad e integraciones externas.

**Regla explícita de UI:** dashboard, navegación, componentes, estilos o diseño visual deben poder cambiarse sin reescribir reglas financieras, persistencia ni servicios, salvo que el cambio funcional lo exija.

Evitar dependencias circulares, acoplamiento innecesario y lógica financiera incrustada en componentes visuales.

## 6. Código limpio

No conservar código muerto, duplicado, comentado como archivo histórico, hacks permanentes, imports sin uso, dependencias sin uso, archivos temporales ni implementaciones reemplazadas. Git conserva el historial.

No arrastrar código legacy de otros proyectos a Cash-X salvo migración explícita, revisada y justificada.

## 7. Git, ramas y PR

- No modificar `main` directamente.
- Usar Conventional Commits.
- Una rama por cambio coherente.
- Revisar trabajo equivalente antes de crear rama.
- PR con objetivo, alcance, riesgos, pruebas, dependencias y siguiente paso.
- No fusionar con CI relevante fallando.
- Retirar ramas temporales cuando dejen de ser necesarias.

## 8. Seguridad y privacidad

El repositorio es público. Nunca subir:

- secretos, tokens, contraseñas o claves privadas;
- keystores o certificados de firma;
- credenciales de servicios;
- bases de datos reales;
- respaldos de usuarios;
- recibos, facturas o comprobantes reales;
- nombres, teléfonos, cuentas u otros datos personales;
- movimientos financieros reales;
- logs con contenido privado.

Los datos de usuario deben vivir fuera del repositorio. Usar mínimo privilegio, validación de entradas, límites razonables y almacenamiento únicamente de lo necesario.

Si un secreto llega al historial, eliminarlo del uso inmediatamente y rotarlo; borrar el archivo no vuelve seguro un secreto ya publicado.

## 9. Dependencias y servicios externos

Antes de agregar una dependencia o proveedor, revisar necesidad, mantenimiento, licencia, seguridad, tamaño, compatibilidad, costo y alternativa nativa. No activar servicios facturables sin verificar precio/límites actuales y obtener aprobación.

Preferir documentación oficial para datos que pueden cambiar.

## 10. Datos y persistencia

Para cada dato persistente definir qué se guarda, por qué, recuperación, corrupción, expiración/limpieza cuando aplique y estrategia de backup. Operaciones repetibles deben evitar duplicados e inconsistencias.

No borrar o migrar datos sin estrategia explícita de recuperación.

## 11. Pruebas y CI

Ejecutar solo las validaciones relevantes al cambio: tests, lint, typecheck, build, Android u otras. Priorizar comportamiento real, errores, límites, persistencia, permisos y regresiones.

CI fallando se diagnostica por el error real; no se adivina la causa.

## 12. Documentación obligatoria

Mantener actualizados como mínimo:

- `README.md`;
- `docs/STATE.md`;
- `docs/ROADMAP.md`;
- `docs/ARCHITECTURE.md`;
- `docs/DECISIONS.md`;
- `docs/KNOWN_ISSUES.md`;
- `docs/SECURITY.md`;
- `docs/SESSIONS.md`.

El repositorio debe permitir que un chat nuevo sepa dónde estamos, qué está terminado, qué falla, qué no debe tocarse y cuál es el siguiente paso sin depender de conversaciones anteriores.

## 13. Decisiones y deuda técnica

Registrar decisiones importantes con contexto, alternativas, motivo y consecuencias. Si se acepta una solución temporal, marcar riesgo y condición de retiro. No convertir deuda temporal en arquitectura permanente por silencio.

## 14. Compatibilidad, migraciones y UX

No romper contratos, datos o experiencia de usuario accidentalmente. Las migraciones deben ser progresivas: nueva capa → prueba → adaptación → migración por función → validación → retiro del legado.

Los cambios visuales deben considerar foco, etiquetas, estados disabled, contraste, lectores de pantalla y feedback comprensible.

## 15. Operaciones y fallos

Distinguir solicitado, iniciado, procesando, completado, fallido, cancelado y expirado. No reportar éxito antes de completar el contrato real. Definir timeouts, cancelación y cleanup cuando corresponda.

Fallbacks no deben crear loops, duplicados ni fingir éxito.

## 16. Prioridades

Orden permanente:

1. seguridad;
2. integridad de datos;
3. exactitud;
4. estabilidad;
5. simplicidad;
6. mantenibilidad;
7. costo;
8. desempeño;
9. velocidad de desarrollo.

Aplicar siempre: necesidad actual > diseño limpio > extensibilidad razonable > especulación futura.

## 17. Explicación visual y decisiones de producto

Cuando se definan funciones, pantallas, flujos o decisiones de UX con el propietario del proyecto:

- explicar una decisión o un grupo pequeño de decisiones a la vez; no descargar todo el diseño de golpe;
- usar lenguaje simple y separar claramente lo que verá el usuario de los nombres técnicos internos;
- cuando ayude a entender, incluir wireframes en texto/ASCII, ejemplos de formularios, tarjetas, botones o recorridos de pantalla sin necesidad de generar una imagen;
- mostrar primero cómo se vería o usaría la opción y después explicar la lógica técnica relevante;
- si hay alternativas reales, presentar pocas opciones claras con sus diferencias y recomendar una sin ocultar las demás;
- no avanzar a la siguiente decisión importante hasta que la actual quede entendida y aceptada, salvo que el propietario pida avanzar más rápido;
- mantener estas explicaciones visuales desacopladas de la implementación final: un wireframe de conversación orienta UX, pero no obliga a acoplar dominio, persistencia o servicios al diseño mostrado.

Esta regla aplica especialmente durante definición de producto y UI de Cash-X.