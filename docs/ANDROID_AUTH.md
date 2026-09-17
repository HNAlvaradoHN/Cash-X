# Autorización Google Drive en Android

**Fecha de validación:** 2026-09-17  
**Sesión:** Cash-X #1  
**Estado:** dependencia/API nativa compilada en spike; OAuth real pendiente

## Objetivo

Validar, antes de adoptar una dependencia de producción, que la base Android actual de Cash-X puede compilar la API nativa moderna de Google Play services necesaria para solicitar acceso limitado a `appDataFolder` sin backend propio, secretos ni acceso offline de servidor.

## Dependencia evaluada

`com.google.android.gms:play-services-auth:22.0.0`

Google publicó esta versión el 2026-08-26. Sus release notes indican la retirada de las APIs antiguas de Google Sign-In; para autenticación de identidad Google dirige a Credential Manager. La API de autorización de acceso a datos (`AuthorizationClient`/`AuthorizationRequest`) permanece disponible y el probe de Cash-X la compiló correctamente.

La dependencia **no queda todavía incorporada al APK normal ni a los archivos de producción del repositorio**. El spike la inyectó temporalmente en el proyecto Android generado por CI, después de subir el APK normal, y luego restauró `build.gradle`, eliminó la clase de prueba y limpió el build.

## API validada

El probe compiló una clase Java mínima que:

- obtiene `AuthorizationClient` mediante `Identity.getAuthorizationClient(activity)`;
- construye `AuthorizationRequest`;
- solicita únicamente `new Scope(Scopes.DRIVE_APPFOLDER)`;
- llama `authorize(request)`;
- no usa `requestOfflineAccess`;
- no contiene client IDs, secretos, tokens ni cuentas reales.

`Scopes.DRIVE_APPFOLDER` corresponde al alcance `https://www.googleapis.com/auth/drive.appdata` usado por `appDataFolder`.

## Evidencia de CI

Ejecución de evidencia: GitHub Actions `Cash-X CI` run `35224732148`, PR #43.

Resultado:

- `verify`: verde;
- build web: verde;
- APK normal: verde y subido **antes** de inyectar el probe;
- compilación `play-services-auth:22.0.0` + `AuthorizationClient`: verde (`CASHX_AUTH_PROBE_COMPILE_OK`);
- restauración del proyecto generado tras el probe: verde;
- build del persistence probe existente: verde;
- emulador Android API 35: verde;
- persistencia IndexedDB/Blob tras `force-stop` y reapertura: verde.

Tamaños medidos sobre APK debug sin optimización final de release:

| Medida | Bytes | Aproximado |
| --- | ---: | ---: |
| APK normal Cash-X | 4,118,190 | 3.93 MiB |
| APK temporal con `play-services-auth` | 7,788,698 | 7.43 MiB |
| Delta temporal | 3,670,508 | +3.50 MiB / +89.1% |

El delta es **evidencia orientativa del build debug**, no una predicción del APK/AAB release: shrinker, R8, App Bundle, ABI y dependencias finales pueden cambiarlo. Debe volver a medirse cuando exista un bridge real antes de release.

## Evaluación de la dependencia

### Mantenimiento

La biblioteca es publicada por Google en Google Maven y tuvo una versión nueva el 2026-08-26. La API usada compiló contra el stack actual de Cash-X: Capacitor 8.5.2, Gradle 8.14.3, JDK 21 y Android generado por CI.

### Seguridad

La dirección aprobada para Android mantiene mínimo privilegio: `drive.appdata` para datos internos. No se solicitará acceso amplio `drive` ni `requestOfflineAccess` mientras Cash-X no tenga backend que necesite server auth code/refresh token.

Un access token real será tratado como credencial efímera y solo llegará a TypeScript detrás de `CloudAuthorizationProvider`; nunca se versionará ni se imprimirá deliberadamente en logs.

### Licencias y avisos

No se asumirá que Google Play services es una dependencia open source por el hecho de descargarse desde Maven. Google documenta que sus SDKs pueden incluir o depender de componentes open source y que el desarrollador es responsable de mostrar los avisos correspondientes. Antes de una entrega se debe integrar o auditar el mecanismo de OSS notices adecuado y revisar los términos aplicables de Google.

### Tamaño

El costo de tamaño debug es material (~3.50 MiB en este probe). Esto no bloquea la función, pero impide adoptar la dependencia sin volver a medir la variante real y sin revisar si el bridge puede limitar dependencias/transitivos.

### Costo operativo

Este spike solo compila el SDK y no realiza llamadas Drive ni habilita cuotas pagadas. Antes de la validación real se deben revisar de nuevo cuotas/precios actuales de Google Drive API. Cash-X no habilitará consumo billable sin aprobación explícita del propietario.

## Decisión del spike

La dependencia/API es **compatible técnicamente para continuar el prototipo Android**, pero todavía **no se adopta como dependencia permanente de producción**.

La siguiente implementación debe ser un bridge nativo pequeño detrás de `CloudAuthorizationProvider`, manteniendo la dependencia encapsulada en plataforma Android. Solo después de configurar el cliente OAuth Android de prueba fuera del repositorio se hará la prueba real de consentimiento y access token.

## Siguiente validación real

```text
Google Cloud (fuera de Git)
        │
        ├── paquete: com.cashx.app
        └── SHA de firma de prueba
                  │
                  ▼
Android AuthorizationClient
      scope: drive.appdata
                  │
                  ▼
CloudAuthorizationProvider
                  │
                  ▼
GoogleDriveCloudSyncProvider
                  │
                  ▼
          appDataFolder real
```

Luego se ejecutará `Android A -> appDataFolder -> Android B` con la misma cuenta de prueba y se repetirán replay, offline/reconexión y conflicto real.

## Referencias oficiales

- Google Play services release notes: https://developers.google.com/android/guides/releases
- Configuración de Google Play services: https://developers.google.com/android/guides/setup
- Open-source notices en Google Play services: https://developers.google.com/android/guides/opensource
- `AuthorizationClient`: https://developers.google.com/android/reference/com/google/android/gms/auth/api/identity/AuthorizationClient
- `AuthorizationRequest`: https://developers.google.com/android/reference/com/google/android/gms/auth/api/identity/AuthorizationRequest.Builder
- Scopes Android: https://developers.google.com/android/reference/com/google/android/gms/common/Scopes
- Drive `appDataFolder`: https://developers.google.com/workspace/drive/api/guides/appdata
