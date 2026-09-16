# Seguridad y privacidad

Cash-X usa un repositorio público. El código puede ser público; los datos de usuarios no.

## Prohibido en Git

Nunca subir:

- contraseñas, tokens, claves API o secretos;
- keystores, certificados o claves de firma;
- credenciales de Google, Firebase, Drive u otros proveedores;
- bases de datos reales;
- respaldos reales;
- recibos, facturas o comprobantes reales;
- nombres, teléfonos, correos, cuentas o identificadores personales de usuarios;
- movimientos financieros reales;
- logs con contenido privado.

Los ejemplos deben usar datos ficticios.

## Configuración

- Valores sensibles: variables/secretos del entorno de ejecución o GitHub Secrets cuando corresponda.
- `.env` real siempre ignorado.
- Un `.env.example` solo puede contener nombres de variables y valores ficticios/no sensibles.
- La firma Android nunca debe depender de una clave privada almacenada en el repositorio.

## Datos locales

Guardar únicamente lo necesario para la función elegida por el usuario. Los comprobantes y respaldos deben permanecer en almacenamiento privado del dispositivo o proveedor aprobado.

Antes de elegir persistencia se definirá:

- cifrado necesario;
- estrategia de backup/restauración;
- manejo de corrupción;
- eliminación y limpieza;
- migraciones de esquema;
- límites de tamaño de adjuntos.

## Repositorio público e incidentes

Borrar un secreto de la rama actual no elimina una exposición anterior. Si un secreto entra al historial:

1. revocarlo o rotarlo inmediatamente;
2. retirar el contenido del historial cuando sea posible;
3. revisar logs, artefactos y ramas relacionadas;
4. documentar el incidente sin copiar el secreto.

## Dependencias

Toda dependencia nueva debe justificar necesidad, licencia, mantenimiento y riesgo. Evitar dependencias que recopilen telemetría innecesaria o envíen información financiera a terceros.
