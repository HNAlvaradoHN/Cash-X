# Sincronización opcional de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** arquitectura, transporte Drive y motor local/simulado de conflictos/recuperación implementados; OAuth real y E2E Drive multi-dispositivo pendientes

## Objetivo

Permitir que Cash-X funcione completamente local cuando el usuario no conecte ninguna nube y, opcionalmente, sincronice sus datos entre PWA, Android y otros dispositivos usando únicamente el almacenamiento del propio usuario en Google Drive, sin Supabase, Firebase, Cloudflare, backend propio ni una cuenta central de Cash-X.

La prioridad sigue siendo local-first: la nube mejora sincronización y recuperación, pero nunca debe ser requisito para registrar o consultar datos.

## Modos de funcionamiento

### 1. Solo local

Si el usuario no conecta Google Drive:

`Cash-X -> Dexie/IndexedDB local del dispositivo`

- todas las funciones esenciales continúan disponibles offline;
- los datos permanecen únicamente en ese dispositivo hasta que el usuario exporte un respaldo o conecte Drive;
- desinstalar, borrar datos de la aplicación/navegador o perder el dispositivo puede eliminar esa copia local, por lo que el respaldo manual sigue siendo importante.

### 2. Google Drive conectado

Si el usuario conecta Google Drive:

`Cash-X local <-> Google Drive <-> Cash-X local en otros dispositivos`

- cada dispositivo conserva su base local completa para seguir funcionando offline;
- Google Drive actúa como transporte de sincronización y copia remota, no como la base de datos operativa principal;
- al volver a tener conexión, Cash-X intercambia cambios pendientes y actualiza la copia local;
- conectar Drive no elimina la copia local.

## Identidad y acceso

Cash-X no implementará una cuenta propia ni contraseña propia para la sincronización de Google Drive.

La experiencia inicial será equivalente a:

`Configuración -> Sincronización -> Conectar Google Drive`

Google realizará selección/autenticación de la cuenta y consentimiento OAuth. Cash-X podrá mostrar localmente la cuenta conectada, pero no necesita guardar una cuenta de usuario en un servidor propio.

En otro teléfono, tablet o PC, el usuario conecta la misma cuenta de Google y Cash-X encuentra el espacio de sincronización de esa cuenta.

### Por qué no correo + PIN propio

Enviar un PIN por correo requiere que algún servicio confiable genere, almacene temporalmente y entregue ese código. Sin backend, proveedor de correo o servicio de autenticación no existe un emisor seguro que pueda hacerlo.

Por eso v0.1 no construirá un sistema ficticio de correo/PIN. Google ya autentica la cuenta que autoriza Drive y cumple esa función sin introducir infraestructura propia de Cash-X.

## Permisos de Google Drive

Se aplicará mínimo privilegio:

- `drive.appdata` para el estado interno de sincronización que el usuario no debe editar manualmente;
- `drive.file` solo para crear/administrar archivos visibles que Cash-X haya creado, por ejemplo respaldos y exportaciones;
- no se solicitará acceso amplio `drive` a todos los archivos del usuario.

### Organización estricta en Drive

La sincronización viva usa `appDataFolder`, espacio de aplicación aislado de los archivos visibles del usuario.

Los archivos visibles creados automáticamente por Cash-X solo pueden existir bajo esta jerarquía:

```text
Mi unidad
└── Cash-X
    ├── Backups
    └── Exportaciones
```

Reglas:

- no se crean archivos visibles automáticos directamente en la raíz de Mi unidad;
- `Cash-X`, `Backups` y `Exportaciones` usan identidades privadas mediante `appProperties` para poder reutilizarse;
- si aparecen múltiples carpetas administradas para el mismo rol, la operación se detiene en lugar de crear otra y aumentar la dispersión;
- una ubicación visible distinta solo se permitirá mediante una futura acción explícita del usuario de guardar/copiar en otra carpeta;
- detalles de transporte y pruebas: `docs/DRIVE.md`.

## Motor de sincronización

La base local Dexie/IndexedDB sigue siendo la fuente operativa del dispositivo. La sincronización se implementa detrás de contratos independientes para que el dominio financiero no conozca Google Drive.

Flujo:

`UI -> casos de uso -> repositorios locales -> Dexie/IndexedDB`

`                         -> SyncEngine -> CloudSyncProvider -> Google Drive`

La sincronización nunca debe modificar directamente componentes de UI ni saltarse las validaciones del dominio.

El transporte implementado separa:

- `CloudAuthorizationProvider`: entrega un access token sin acoplar el transporte a una estrategia OAuth concreta;
- `GoogleDriveHttpClient`: REST Drive v3, timeout, cancelación y reintentos acotados;
- `GoogleDriveCloudSyncProvider`: objetos internos en `appDataFolder`;
- `GoogleDriveVisibleFileStore`: archivos visibles restringidos a la jerarquía `Cash-X`.

El motor local/simulado ya separa además:

- `VersionedSyncOperation` + `resolveSyncOperations`: identidad, versiones base, deduplicación y detección determinista de conflicto;
- `PersistentSyncState`: oplog y conflictos persistentes en Dexie;
- `OfflineSyncQueue`: cola de salida persistente con confirmación parcial y retry/backoff;
- `RemoteSyncPull`: cursor remoto persistente y aplicación transaccional de páginas.

## Cambios, idempotencia y orden

Cada instalación tendrá un `deviceId` estable y cada cambio sincronizable tendrá un identificador único.

El protocolo soporta conceptualmente creación, edición, Papelera, restauración, eliminación definitiva, categorías/campo adicional, configuración, metadatos y comprobantes. La conexión de todas esas entidades al oplog se hará cuando avance el núcleo financiero/productivo.

Los cambios se aplican idempotentemente: recibir el mismo cambio dos veces no puede duplicar ingresos, egresos ni comprobantes.

El transporte Drive usa claves estables en `appProperties`: si una clave existe exactamente una vez, se actualiza el mismo archivo; si aparecen múltiples archivos para la misma identidad, se rechaza el estado ambiguo en vez de sobrescribir silenciosamente.

La cola offline conserva orden determinista, confirmación parcial y estado de retry a través de cierre/reapertura. Las operaciones confirmadas no reaparecen como pendientes.

El pull remoto persiste un cursor por origen. El cursor solo avanza tras ingerir por completo la página; un fallo transaccional deja intactos cursor, oplog y conflictos. Repetir una página ya confirmada es idempotente y una página fuera de orden se rechaza.

## Conflictos entre dispositivos

Cash-X no sobrescribirá silenciosamente dos ediciones concurrentes del mismo registro financiero.

Regla implementada en el núcleo:

- cambios independientes se conservan sin conflicto;
- si dos dispositivos modifican el mismo objeto desde una misma versión base antes de sincronizar, se conservan ambas operaciones y se persiste un conflicto;
- borrar/restaurar también se representa como una operación versionada;
- una colisión de `operationId` con contenido diferente se rechaza y revierte la transacción;
- la resolución es determinista independientemente del orden de entrega.

La integridad financiera tiene prioridad sobre una sincronización aparentemente simple que pueda perder información.

PR #31 añadió el núcleo de conflicto; PR #33 lo hizo persistente; PR #35 añadió replay offline; PR #37 añadió pull/cursor transaccional; PR #39 valida la interacción de esas piezas entre dos bases simuladas con reinicios, replays y conflicto concurrente.

La **detección/preservación** del conflicto está validada; la UX para que el usuario elija o reconcilie versiones todavía no está implementada.

## Comprobantes

Los comprobantes se sincronizan detrás de `AttachmentStore`/`CloudSyncProvider` y no dentro de la lógica del saldo.

Cada archivo debe tener identificador estable, tamaño, tipo y hash de integridad. El hash permite validar descargas y evitar duplicados idénticos cuando sea razonable.

Los metadatos y el archivo binario deben poder recuperarse de forma coherente; una sincronización parcial no puede dejar un registro apuntando silenciosamente a un comprobante inexistente sin marcar ese estado.

El contenedor `.cashx` v1 ya transporta datos estructurados y comprobantes con SHA-256, por lo que Drive puede tratar ese backup como un `Blob` opaco y la restauración conserva su propia verificación de integridad.

## Cuándo sincroniza

En v0.1 se intentará sincronizar:

- al abrir la aplicación si existe conexión y autorización válida;
- después de cambios locales, con agrupación/debounce;
- al recuperar conectividad;
- cuando el usuario pulse `Sincronizar ahora`.

La PWA sin backend no prometerá sincronización continua mientras el navegador esté completamente cerrado. Si Google requiere renovar autorización, Cash-X mostrará una acción clara para reconectar Drive sin afectar los datos locales.

Android podrá aprovechar capacidades nativas de autenticación/almacenamiento seguro, pero el dominio y el protocolo de sincronización serán los mismos.

## Errores, reintentos y límites

El transporte Drive implementado:

- reintenta de manera acotada HTTP 408, 429, 5xx y 403 de rate limit conocidos;
- respeta `Retry-After` cuando Google lo devuelve;
- usa backoff exponencial acotado cuando no existe `Retry-After`;
- tiene timeout por solicitud;
- acepta cancelación externa mediante `AbortSignal`;
- no reintenta indefinidamente errores de autorización o validación.

El motor local persiste el estado necesario para reanudar push/pull después de reinicios sin asumir que una operación incompleta quedó confirmada.

Las cuotas y condiciones reales todavía deben medirse con una cuenta de prueba y dispositivos reales antes de considerar el checkpoint cerrado.

## Desconectar Google Drive

Desconectar Drive:

- detiene nuevas sincronizaciones;
- conserva todos los datos locales del dispositivo;
- no borra automáticamente los datos remotos;
- borrar la copia remota será una acción separada, destructiva y con confirmación explícita.

## Google Drive como único proveedor inicial

Google Drive será el único proveedor cloud implementado inicialmente.

TeraBox no se incluirá en la primera implementación. La arquitectura `CloudSyncProvider` permitirá evaluar un adaptador futuro solo si su API oficial, OAuth, estabilidad, políticas, costos y capacidades cumplen los requisitos de Cash-X.

No se usarán endpoints no oficiales o ingeniería inversa como base de almacenamiento financiero.

## Costos y cuotas

La sincronización debe minimizar llamadas, agrupar cambios y aplicar backoff ante límites de API.

Antes de habilitar cualquier configuración que pueda generar cargos se verificarán precios/cuotas vigentes y se requerirá aprobación explícita del propietario. Los archivos ocupan el almacenamiento de la cuenta de Google Drive del usuario.

## Seguridad

- nunca se guardan tokens, secretos, respaldos reales ni datos financieros reales en Git;
- se usan scopes mínimos;
- no se incrusta un `client_secret` privado en la PWA;
- tokens de acceso web se mantienen con el menor alcance/vida necesarios y no se tratan como contraseñas permanentes;
- si se adopta almacenamiento seguro nativo en Android, se mantiene detrás de un adaptador de plataforma;
- la sincronización valida versión, esquema, identificadores, hashes y relaciones antes de aplicar cambios;
- restaurar/sincronizar datos externos nunca omite las reglas del dominio.

## Validación actual

PR #29 valida con HTTP simulado:

- `appDataFolder` como único destino de objetos internos;
- creación, listado/búsqueda, actualización y descarga;
- no duplicar una identidad remota existente;
- rechazar identidades ambiguas duplicadas;
- reintento de rate limit;
- creación y reutilización de `Mi unidad/Cash-X/Backups`;
- ausencia de archivos visibles automáticos sueltos en la raíz.

PRs #31, #33, #35, #37 y #39 validan el motor local/simulado:

- operaciones/versiones deterministas y conflictos explícitos;
- oplog/conflictos persistentes con rollback;
- cola offline persistente, confirmación parcial y retry;
- cursor remoto y pull transaccional;
- dos instalaciones independientes que trabajan offline, reinician, intercambian operaciones y convergen al mismo oplog;
- replay sin duplicados;
- conflicto concurrente preservado en ambos lados;
- fallo de página sin avance falso del cursor ni escritura parcial.

El CI general mantiene typecheck, tests, build web, APK debug y probe Android verdes.

## Validación obligatoria todavía pendiente antes de considerarlo listo

- autorización Google real desde PWA;
- autorización Google real desde Android/Capacitor;
- crear datos en un dispositivo y recibirlos en otro con la misma cuenta a través de Drive real;
- repetir offline/reconexión, reintentos e idempotencia contra Drive real;
- conflicto real sobre el mismo registro sin pérdida silenciosa;
- Papelera/restauración entre dispositivos sobre transporte real;
- comprobantes con hash, descarga y cleanup remotos;
- interrupción de red en mitad de una sincronización real;
- desconectar/reconectar Drive sin perder datos locales;
- límites y errores de cuota sin reintentos infinitos;
- prueba física Android antes de release;
- UX de resolución de conflictos antes de exponer la función final al usuario.

## Referencias externas verificadas

- Google Drive API scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Google Drive appDataFolder: https://developers.google.com/workspace/drive/api/guides/appdata
- Google Identity Services / autorización web: https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model
- Google Drive API limits/pricing: https://developers.google.com/workspace/drive/api/guides/limits
- Búsqueda y `appProperties`: https://developers.google.com/workspace/drive/api/guides/search-files
- Límites de propiedades personalizadas: https://developers.google.com/workspace/drive/api/guides/properties
