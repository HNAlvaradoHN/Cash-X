export interface CloudAuthorizationProvider {
  getAccessToken(signal?: AbortSignal): Promise<string>;
}

export interface RemoteSyncObject {
  key: string;
  remoteId: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
}

export interface CloudSyncProvider {
  list(signal?: AbortSignal): Promise<RemoteSyncObject[]>;
  put(key: string, payload: Blob, signal?: AbortSignal): Promise<RemoteSyncObject>;
  get(key: string, signal?: AbortSignal): Promise<Blob | null>;
}

export type VisibleDriveSection = 'Backups' | 'Exportaciones';

export interface VisibleDriveObject {
  objectKey: string;
  remoteId: string;
  section: VisibleDriveSection;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
}
