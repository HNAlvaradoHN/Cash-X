# Backup externo de Cash-X

**Fecha:** 2026-09-16  
**Sesión:** Cash-X #1  
**Formato inicial:** `.cashx`, versión de archivo 1

## Objetivo

Permitir que una instalación de Cash-X exporte un único archivo autocontenido que pueda restaurarse en otra instalación sin servidor, cuenta Cash-X ni proveedor cloud. El mismo archivo será reutilizable más adelante como objeto de backup en Google Drive.

## Principios

- El backup no depende de Google Drive ni de ningún backend.
- Debe conservar datos estructurados y bytes reales de comprobantes.
- Debe detectar truncamiento y corrupción antes de escribir datos en la base local.
- La restauración debe ser transaccional a nivel de tablas e idempotente para el mismo conjunto de IDs.
- El formato debe estar versionado para permitir migraciones futuras.
- No se usa JSON para transportar directamente `Blob`.
- No se añade una dependencia ZIP mientras no exista una necesidad que lo justifique.

## Contenedor v1

El archivo usa MIME `application/vnd.cash-x.backup` y extensión `.cashx`.

Disposición binaria:

```text
┌──────────────────────────────────────────┐
│ Magic: CASHX-BACKUP-V1\n     (16 bytes) │
├──────────────────────────────────────────┤
│ Longitud del manifiesto      (4 bytes)   │
│ uint32 big-endian                        │
├──────────────────────────────────────────┤
│ SHA-256 del manifiesto       (32 bytes)  │
├──────────────────────────────────────────┤
│ Manifiesto JSON              (N bytes)   │
├──────────────────────────────────────────┤
│ Comprobante 1 — bytes crudos             │
├──────────────────────────────────────────┤
│ Comprobante 2 — bytes crudos             │
├──────────────────────────────────────────┤
│ ...                                      │
└──────────────────────────────────────────┘
```

El manifiesto contiene:

- versión del contenedor y versión lógica del backup;
- versión del esquema local;
- fecha de exportación;
- libros;
- ingresos/egresos;
- categorías;
- metadatos internos;
- metadatos de cada comprobante;
- `offset` y longitud de cada payload binario;
- SHA-256 calculado sobre los bytes reales de cada comprobante;
- tamaño total del payload binario.

Los bytes de comprobantes se guardan sin Base64 para evitar el incremento aproximado de un tercio que produciría codificarlos dentro de JSON.

## Validación antes de restaurar

La importación v1 rechaza el archivo antes de tocar IndexedDB si ocurre cualquiera de estas condiciones:

- magic/header no reconocido;
- manifiesto demasiado grande o truncado;
- SHA-256 del manifiesto incorrecto;
- JSON inválido;
- versión de archivo/payload no soportada;
- tipos o campos obligatorios inválidos;
- IDs o claves duplicados;
- categoría sin libro correspondiente;
- registro sin libro o categoría correspondiente;
- comprobante sin registro correspondiente;
- rangos binarios no contiguos, fuera del archivo o con longitud incorrecta;
- tamaño total distinto al declarado;
- SHA-256 de cualquier comprobante distinto al calculado sobre sus bytes.

Solo después de decodificar y validar completamente el archivo se llama a `LocalPersistence.restoreBackup`, que realiza `bulkPut` de las tablas dentro de una transacción Dexie.

## Idempotencia

Restaurar dos veces el mismo archivo no crea duplicados porque las entidades mantienen IDs estables y `bulkPut` reemplaza la misma identidad. Esta propiedad es apropiada para recuperación manual.

La sincronización multi-dispositivo tendrá reglas adicionales de conflicto y no debe reutilizar ciegamente el comportamiento de restauración como estrategia de merge.

## Papelera

El backup conserva también elementos que todavía están en Papelera, incluyendo comprobantes con `deletedAt`, para que restaurar una copia represente el estado completo de la instalación exportada.

## Límites y seguridad

- El manifiesto v1 se limita a 16 MiB para evitar entradas anómalas antes de parsear.
- Los tamaños y offsets deben ser enteros seguros de JavaScript.
- Cada comprobante se verifica independientemente mediante SHA-256.
- v1 **no cifra** el archivo. Quien tenga acceso al `.cashx` puede potencialmente leer los datos y comprobantes; la UI futura deberá comunicarlo claramente al exportar.
- El cifrado de backup puede añadirse en una versión posterior sin cambiar el dominio financiero.
- La validación actual no sustituye pruebas físicas de cuota/memoria con backups grandes en dispositivos reales.

## Flujo técnico

```text
Instalación A
    │
    ├─ LocalPersistence.exportBackup()
    │
    ├─ encodeCashXBackupFile()
    │
    ▼
 archivo .cashx
    │
    ├─ decode + validar integridad completa
    │
    ├─ LocalPersistence.restoreBackup()
    │
    ▼
Instalación B
```

`CashXBackupFileService` encapsula ese flujo para que la UI futura y el adaptador Google Drive trabajen con un `Blob` único sin conocer la estructura interna de Dexie.
