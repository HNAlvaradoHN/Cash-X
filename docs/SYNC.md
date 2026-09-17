# Sincronización opcional de Cash-X

**Fecha de decisión:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** arquitectura, transporte Drive, conflictos, recuperación offline y motor cloud detrás de `CloudSyncProvider` implementados; OAuth/Drive reales pendientes

## Objetivo

Cash-X debe funcionar completamente local sin nube y, opcionalmente, sincronizar entre instalaciones usando Google Drive del propio usuario, sin Supabase, Firebase, Cloudflare, backend propio ni cuenta central de Cash-X.

`Cash-X local <-> Google Drive <-> Cash-X local`

Cada dispositivo conserva su copia local completa. Drive es transporte y copia remota; no es la base operativa principal.

## Permisos y organización de Drive

Se aplica mínimo privilegio:

- `drive.appdata` para sincronización interna en `appDataFolder`;
- `drive.file` solo cuando el usuario use archivos visibles administrados por Cash-X, como backups/exportaciones;
- nunca scope amplio `drive` para todos los archivos del usuario.

Archivos visibles automáticos solo pueden existir aquí:

```text
Mi unidad
└── Cash-X
    ├── Backups
    └── Exportaciones
```

No se crean archivos visibles automáticos en la raíz. Las carpetas se reutilizan mediante identidades privadas; una ambigüedad de carpetas administradas se rechaza en vez de crear otra copia.

## Capas

```text
casos de uso
    │
    ├── repositorios locales -> Dexie/IndexedDB
    │
    └── CloudSyncEngine
           │
           ├── OfflineSyncQueue
           ├── RemoteSyncPull
           ├── PersistentSyncState
           └── CloudSyncProvider
                    │
                    └── GoogleDriveCloudSyncProvider
                              │
                              └── GoogleDriveHttpClient
```

`CloudAuthorizationProvider` permanece separado del transporte para que web/Android puedan obtener tokens con estrategias de plataforma distintas.

## Operaciones, conflictos e idempotencia

Cada instalación tiene `deviceId` estable y cada cambio sincronizable tiene `operationId` único. `VersionedSyncOperation` incluye entidad, versión base, acción y valor.

Reglas ya implementadas:

- replay de la misma operación es idempotente;
- misma `operationId` con contenido distinto es una colisión y se rechaza;
- cambios independientes se conservan;
- dos cambios desde la misma versión base sobre el mismo objeto generan conflicto explícito;
- delete/restore también son operaciones versionadas;
- oplog y conflictos persisten en Dexie;
- una colisión durante ingestión revierte toda la transacción.

## Cola offline

`OfflineSyncQueue` persiste:

- orden de envío determinista;
- confirmación parcial;
- contador de intentos;
- próximo intento mediante política inyectable;
- estado después de cerrar/reabrir.

Una operación no se marca confirmada hasta que la capa cloud devuelve éxito.

## Pull remoto y cursor

`RemoteSyncPull` mantiene un cursor por origen remoto. Una página se aplica junto con oplog/conflictos dentro de una transacción. El cursor avanza únicamente después de ingestión completa; una colisión o fallo revierte datos y cursor. Repetir la misma página confirmada no duplica datos.

## Protocolo cloud por dispositivo

PR #41 añade `CloudSyncEngine` encima de `CloudSyncProvider`.

Cada dispositivo publica un snapshot versionado con clave:

`oplog:<deviceId>`

El snapshot contiene únicamente operaciones originadas por ese dispositivo. Antes de publicar, Cash-X descarga el snapshot remoto existente del mismo dispositivo y fusiona con las operaciones locales pendientes. La unión es monotónica: una reinstalación local que todavía no haya recuperado todo su historial no puede reducir el historial remoto previo del mismo `deviceId`.

Flujo de push:

```text
syncQueue pendiente
      │
      ▼
leer oplog:<deviceId> remoto
      │
      ▼
fusión monotónica + validación
      │
      ▼
CloudSyncProvider.put
      │ éxito
      ▼
confirmar operaciones locales
```

Flujo de pull:

```text
CloudSyncProvider.list
      │
      ├── ignorar snapshot propio
      ▼
descargar snapshot remoto
      │
      ├── validar formato/deviceId/operaciones
      ├── SHA-256 del contenido -> cursor
      ▼
RemoteSyncPull.applyPage
      │
      ▼
oplog + conflictos + cursor atómicos
```

El formato del snapshot es JSON interno, versionado y acotado a 8 MiB como límite de seguridad del protocolo actual; ese valor no es un límite de comprobantes ni una promesa de cuota del producto.

## Evidencia automatizada

PRs #31/#33/#35/#37/#39 validan el motor local: conflictos deterministas, persistencia, cola offline, cursor remoto, replays, reinicios y convergencia simulada.

PR #41 añade pruebas a través de `CloudSyncProvider` compartido:

- una escritura cloud fallida deja la cola pendiente;
- un retry exitoso confirma después del `put`;
- un reset local tipo reinstalación no borra operaciones remotas previas del mismo dispositivo;
- dos dispositivos publican snapshots, reinician, hacen pull y convergen al mismo oplog;
- el mismo conflicto concurrente queda preservado en ambos lados;
- repetir el pull no duplica;
- un snapshot modificado con colisión no avanza el cursor ni deja operaciones parciales;
- JSON remoto malformado se rechaza antes de cambiar estado local.

El transporte `GoogleDriveCloudSyncProvider` ya está validado por separado contra HTTP simulado (`appDataFolder`, create/list/get/update, `appProperties`, retries y rechazo de duplicados ambiguos). Esta composición deja el siguiente riesgo real concentrado en autorización + Drive real, no en la semántica local.

## OAuth web: restricción de seguridad actual

Google Identity Services mantiene un flujo de access token puramente navegador para apps sin backend y con usuario presente. Sin embargo, la guía actual de Google recomienda el modelo de código de autorización por mayor seguridad, y dicho modelo requiere una plataforma backend para completar el intercambio y almacenar refresh tokens.

Cash-X mantiene por ahora la restricción de **cero backend propio**. Por eso:

- no se guardarán refresh tokens en JavaScript;
- no se incrustará un `client_secret` en la PWA;
- no se adoptará silenciosamente un modelo web que Google marque como de menor seguridad;
- la decisión final para PWA debe aprobarse explícitamente antes de release.

Esta restricción no impide avanzar Android: Google Play services expone `AuthorizationClient`, que puede solicitar un access token para scopes concedidos en el dispositivo sin pedir acceso offline de servidor.

## OAuth Android: dirección aprobada para la siguiente prueba

Para el E2E real Android se usará la API nativa de autorización de Google Play services con scope inicial:

`https://www.googleapis.com/auth/drive.appdata`

No se solicitará `requestOfflineAccess`; Cash-X no necesita un server auth code porque no existe backend. Si hace falta consentimiento o selección de cuenta, `AuthorizationClient` devuelve un `PendingIntent` de resolución. El access token se expondrá a TypeScript únicamente detrás de `CloudAuthorizationProvider` y se tratará como credencial efímera.

La dependencia candidata actual es `com.google.android.gms:play-services-auth:22.0.0`, versión publicada por Google el 26/08/2026. Antes de incorporarla se valida build/licencia/compatibilidad en un checkpoint aislado.

## Comprobantes

`AttachmentStore` mantiene bytes separados del saldo/dominio financiero. El backup `.cashx` ya transporta comprobantes con SHA-256, pero el protocolo vivo cloud de PR #41 todavía sincroniza únicamente operaciones estructuradas. La estrategia remota de bytes necesita un checkpoint propio con hash, id estable, cleanup y fallos parciales antes de habilitarla.

## Desconectar Drive

Desconectar Drive:

- detiene nuevas sincronizaciones;
- conserva todos los datos locales;
- no borra automáticamente los datos remotos;
- borrar la copia remota será una acción separada y destructiva con confirmación explícita.

## Seguridad

- nunca tokens, secretos, backups reales ni datos financieros reales en Git;
- scopes mínimos;
- tokens efímeros con el menor alcance/vida posible;
- datos remotos validados antes de ingerir;
- ningún fallo cloud puede marcar una operación local como confirmada prematuramente;
- conflictos financieros nunca se resuelven con overwrite silencioso;
- cualquier almacenamiento seguro nativo queda detrás de adaptadores de plataforma.

## Costos y cuotas

La sincronización agrupa cambios y aplica backoff. Antes de habilitar cualquier configuración que pueda generar cargos se verifican precios/cuotas vigentes y se requiere aprobación explícita del propietario. Los archivos ocupan almacenamiento de la cuenta Google del usuario.

## Pendiente antes de considerarlo listo

- cliente OAuth Android de prueba configurado fuera del repositorio para `com.cashx.app` + firma de prueba;
- autorización Android real y primer `put/get` en `appDataFolder`;
- dos instalaciones reales con misma cuenta: push/pull, offline/reconexión, replay y conflicto;
- estrategia OAuth PWA final aprobada explícitamente;
- sync vivo de comprobantes con hash/cleanup;
- desconexión/reconexión sin pérdida local;
- límites/cuotas y fallos de red reales;
- prueba Android física;
- UX de resolución de conflictos.

## Referencias externas verificadas

- Google Drive scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- `appDataFolder`: https://developers.google.com/workspace/drive/api/guides/appdata
- Google Identity Services, modelos web: https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model
- Google Identity Services, code model: https://developers.google.com/identity/oauth2/web/guides/use-code-model
- Android `AuthorizationClient`: https://developers.google.com/android/reference/com/google/android/gms/auth/api/identity/AuthorizationClient
- Android `AuthorizationRequest`: https://developers.google.com/android/reference/com/google/android/gms/auth/api/identity/AuthorizationRequest.Builder
- Google Play services release notes: https://developers.google.com/android/guides/releases
