# Google Drive en Cash-X

**Fecha:** 2026-09-16  
**Sesión:** Cash-X #1  
**Estado:** transporte implementado contra HTTP simulado; OAuth real pendiente de credenciales de prueba fuera del repositorio

## Objetivo

Google Drive es el único proveedor cloud inicial de Cash-X. La base local sigue siendo operativa y completa; Drive actúa como transporte opcional y copia remota sin backend propio de Cash-X.

## Regla de orden

Cash-X no dispersa archivos por Google Drive.

```text
Google Drive
├── appDataFolder
│   └── objetos internos de sincronización Cash-X
│
└── Mi unidad
    └── Cash-X
        ├── Backups
        └── Exportaciones
```

- La sincronización interna vive exclusivamente en `appDataFolder`, que no aparece como archivos sueltos en Mi unidad.
- Los archivos visibles creados por Cash-X viven bajo una única carpeta raíz administrada `Cash-X`.
- `Backups` y `Exportaciones` son subcarpetas administradas dentro de esa raíz.
- Un archivo visible no se crea directamente en `root` salvo las carpetas administradas necesarias.
- Una exportación fuera de esa jerarquía solo podrá existir cuando el usuario elija explícitamente otra ubicación mediante una futura acción de guardar/copiar.

Las carpetas se identifican con `appProperties` privadas de la aplicación y se reutilizan. Si Drive devuelve más de una carpeta administrada para el mismo rol, el adaptador falla de forma explícita en lugar de crear otra y agravar la dispersión.

## Permisos mínimos

El transporte está preparado para estos scopes:

- `https://www.googleapis.com/auth/drive.appdata` para datos internos de sincronización;
- `https://www.googleapis.com/auth/drive.file` para la carpeta visible `Cash-X` y archivos creados por la aplicación.

No se requiere el scope amplio `drive` para leer o modificar todo el Drive del usuario.

## Contratos

La autorización está separada del transporte mediante `CloudAuthorizationProvider`. El código de Drive recibe un access token y no conoce cómo lo obtuvo PWA o Android.

`CloudSyncProvider` representa objetos internos por una clave estable. `GoogleDriveCloudSyncProvider` usa `appDataFolder` y `appProperties` para encontrar la misma identidad remota antes de crear o actualizar.

`GoogleDriveVisibleFileStore` impone la jerarquía visible `Cash-X/Backups` o `Cash-X/Exportaciones`; la UI no decide padres arbitrarios para archivos automáticos.

## HTTP, reintentos y cancelación

`GoogleDriveHttpClient`:

- usa Drive API v3 por REST;
- aplica timeout por solicitud;
- acepta cancelación externa mediante `AbortSignal`;
- reintenta de forma acotada HTTP 408, 429, 5xx y los 403 de límite `rateLimitExceeded`/`userRateLimitExceeded`;
- respeta `Retry-After` cuando existe y aplica backoff exponencial acotado cuando no existe;
- no reintenta indefinidamente errores de autorización o validación.

La identidad remota usa `appProperties`, respetando su límite de 124 bytes por par clave+valor; las claves internas que exceden ese límite se rechazan antes de llamar a Drive.

## Integridad e idempotencia

- `put(key, payload)` busca primero la clave estable en `appDataFolder`.
- Si no existe, crea el objeto con padre `appDataFolder`.
- Si existe exactamente uno, actualiza ese archivo y no crea un duplicado.
- Si existen dos o más objetos para la misma clave, se considera un estado ambiguo y se detiene para evitar sobrescritura silenciosa.
- El formato `.cashx` conserva su propia validación SHA-256 antes de ser restaurado localmente; Drive es transporte, no fuente de verdad de integridad.

## Validación actual

Las pruebas automatizadas usan un transporte HTTP simulado y comprueban:

- creación de sincronización solo bajo `appDataFolder`;
- actualización de una identidad existente sin duplicarla;
- descarga de bytes;
- reintento de rate limit acotado;
- creación y reutilización de `Mi unidad/Cash-X/Backups`;
- ausencia de archivos visibles automáticos directamente en la raíz;
- rechazo de identidades duplicadas ambiguas.

El CI general sigue validando además typecheck, pruebas, build web, APK debug y persistencia Android WebView.

## Lo que todavía requiere configuración externa

No se guardan OAuth client secrets, tokens ni cuentas reales en Git.

La prueba E2E real requiere crear/configurar fuera del repositorio:

- un OAuth client ID para PWA con los orígenes autorizados correctos;
- la configuración OAuth adecuada para Android/Capacitor;
- una cuenta Google de prueba y consentimiento para los scopes mínimos.

Hasta completar esa configuración, el transporte REST y sus reglas están implementados y probados contra respuestas simuladas, pero la autorización Google real se considera **pendiente de validación**.

## Referencias oficiales

- App data: https://developers.google.com/workspace/drive/api/guides/appdata
- Crear archivos/carpetas: https://developers.google.com/workspace/drive/api/guides/create-file
- Carpetas y `parents`: https://developers.google.com/workspace/drive/api/guides/folder
- Búsqueda y `appProperties`: https://developers.google.com/workspace/drive/api/guides/search-files
- Propiedades personalizadas y límites: https://developers.google.com/workspace/drive/api/guides/properties
