import type { CloudSyncProvider, RemoteSyncObject } from './contracts';
import {
  driveQueryAppProperty,
  GoogleDriveHttpClient,
  parseDriveSize,
  type DriveFile,
} from './google-drive-http';

const APPDATA_KIND_KEY = 'cashxKind';
const APPDATA_KIND_VALUE = 'sync';
const APPDATA_OBJECT_KEY = 'cashxKey';
const APPDATA_FORMAT_KEY = 'cashxFormat';
const APPDATA_FORMAT_VALUE = '1';
const MAX_APP_PROPERTY_BYTES = 124;

function validateObjectKey(key: string): void {
  if (key.trim().length === 0) throw new Error('Cloud sync object key cannot be empty.');
  const propertyBytes = new TextEncoder().encode(`${APPDATA_OBJECT_KEY}${key}`).byteLength;
  if (propertyBytes > MAX_APP_PROPERTY_BYTES) {
    throw new Error('Cloud sync object key is too long for Google Drive appProperties.');
  }
}

function fileNameForKey(key: string): string {
  const safe = key.replaceAll(/[^A-Za-z0-9._-]/g, '-').replaceAll(/-+/g, '-').slice(0, 80);
  return `cashx-sync-${safe || 'object'}.cashx`;
}

function toRemoteSyncObject(file: DriveFile): RemoteSyncObject {
  const key = file.appProperties?.[APPDATA_OBJECT_KEY];
  if (key === undefined) throw new Error(`Google Drive sync file ${file.id} is missing its Cash-X key.`);

  return {
    key,
    remoteId: file.id,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: parseDriveSize(file.size),
    modifiedAt: file.modifiedTime ?? null,
  };
}

export class GoogleDriveCloudSyncProvider implements CloudSyncProvider {
  constructor(private readonly drive: GoogleDriveHttpClient) {}

  async list(signal?: AbortSignal): Promise<RemoteSyncObject[]> {
    const files = await this.drive.listFiles({
      spaces: 'appDataFolder',
      q: `trashed = false and ${driveQueryAppProperty(APPDATA_KIND_KEY, APPDATA_KIND_VALUE)}`,
      ...(signal === undefined ? {} : { signal }),
    });

    return files.map(toRemoteSyncObject).sort((left, right) => left.key.localeCompare(right.key));
  }

  async put(key: string, payload: Blob, signal?: AbortSignal): Promise<RemoteSyncObject> {
    validateObjectKey(key);
    const existing = await this.findByKey(key, signal);

    if (existing.length > 1) {
      throw new Error(`Google Drive contains multiple Cash-X sync objects for key "${key}".`);
    }

    if (existing.length === 1) {
      const current = existing[0];
      if (current === undefined) throw new Error('Google Drive sync lookup returned an invalid result.');
      const updated = await this.drive.updateMedia(current.id, payload, signal);
      return toRemoteSyncObject(updated);
    }

    const created = await this.drive.createMultipartFile(
      {
        name: fileNameForKey(key),
        parents: ['appDataFolder'],
        appProperties: {
          [APPDATA_KIND_KEY]: APPDATA_KIND_VALUE,
          [APPDATA_OBJECT_KEY]: key,
          [APPDATA_FORMAT_KEY]: APPDATA_FORMAT_VALUE,
        },
      },
      payload,
      signal,
    );
    return toRemoteSyncObject(created);
  }

  async get(key: string, signal?: AbortSignal): Promise<Blob | null> {
    validateObjectKey(key);
    const existing = await this.findByKey(key, signal);

    if (existing.length > 1) {
      throw new Error(`Google Drive contains multiple Cash-X sync objects for key "${key}".`);
    }
    const file = existing[0];
    if (file === undefined) return null;
    return this.drive.downloadFile(file.id, signal);
  }

  private findByKey(key: string, signal?: AbortSignal): Promise<DriveFile[]> {
    return this.drive.listFiles({
      spaces: 'appDataFolder',
      q: `trashed = false and ${driveQueryAppProperty(APPDATA_KIND_KEY, APPDATA_KIND_VALUE)} and ${driveQueryAppProperty(APPDATA_OBJECT_KEY, key)}`,
      ...(signal === undefined ? {} : { signal }),
    });
  }
}
