import type { VisibleDriveObject, VisibleDriveSection } from './contracts';
import {
  driveQueryAppProperty,
  driveQueryEquals,
  GoogleDriveHttpClient,
  parseDriveSize,
  type DriveFile,
} from './google-drive-http';

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const ROOT_FOLDER_NAME = 'Cash-X';
const ROLE_KEY = 'cashxRole';
const FORMAT_KEY = 'cashxFormat';
const FORMAT_VALUE = '1';
const OBJECT_KEY = 'cashxObjectKey';
const ROLE_ROOT = 'root';
const ROLE_VISIBLE_OBJECT = 'visible-object';
const MAX_APP_PROPERTY_BYTES = 124;

function escapeQueryLiteral(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function parentQuery(parentId: string): string {
  return `'${escapeQueryLiteral(parentId)}' in parents`;
}

function roleForSection(section: VisibleDriveSection): string {
  return section === 'Backups' ? 'backups' : 'exports';
}

function validateObjectKey(objectKey: string): void {
  if (objectKey.trim().length === 0) throw new Error('Visible Drive object key cannot be empty.');
  const bytes = new TextEncoder().encode(`${OBJECT_KEY}${objectKey}`).byteLength;
  if (bytes > MAX_APP_PROPERTY_BYTES) {
    throw new Error('Visible Drive object key is too long for Google Drive appProperties.');
  }
}

function validateFileName(fileName: string): void {
  if (fileName.trim().length === 0) throw new Error('Visible Drive file name cannot be empty.');
  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Visible Drive file name must not contain path separators.');
  }
}

function toVisibleObject(
  file: DriveFile,
  objectKey: string,
  section: VisibleDriveSection,
): VisibleDriveObject {
  return {
    objectKey,
    remoteId: file.id,
    section,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: parseDriveSize(file.size),
    modifiedAt: file.modifiedTime ?? null,
  };
}

export class GoogleDriveVisibleFileStore {
  constructor(private readonly drive: GoogleDriveHttpClient) {}

  async put(
    section: VisibleDriveSection,
    objectKey: string,
    fileName: string,
    payload: Blob,
    signal?: AbortSignal,
  ): Promise<VisibleDriveObject> {
    validateObjectKey(objectKey);
    validateFileName(fileName);

    const folder = await this.ensureSectionFolder(section, signal);
    const existing = await this.findObject(folder.id, objectKey, signal);

    if (existing.length > 1) {
      throw new Error(
        `Google Drive contains multiple Cash-X files for object key "${objectKey}" in ${section}.`,
      );
    }

    const current = existing[0];
    if (current !== undefined) {
      const updated = await this.drive.updateMultipartFile(
        current.id,
        {
          name: fileName,
          appProperties: {
            [ROLE_KEY]: ROLE_VISIBLE_OBJECT,
            [OBJECT_KEY]: objectKey,
            [FORMAT_KEY]: FORMAT_VALUE,
          },
        },
        payload,
        signal,
      );
      return toVisibleObject(updated, objectKey, section);
    }

    const created = await this.drive.createMultipartFile(
      {
        name: fileName,
        parents: [folder.id],
        appProperties: {
          [ROLE_KEY]: ROLE_VISIBLE_OBJECT,
          [OBJECT_KEY]: objectKey,
          [FORMAT_KEY]: FORMAT_VALUE,
        },
      },
      payload,
      signal,
    );
    return toVisibleObject(created, objectKey, section);
  }

  private async ensureSectionFolder(
    section: VisibleDriveSection,
    signal?: AbortSignal,
  ): Promise<DriveFile> {
    const root = await this.ensureRootFolder(signal);
    const role = roleForSection(section);
    const matches = await this.drive.listFiles({
      spaces: 'drive',
      q: `trashed = false and ${driveQueryEquals('mimeType', FOLDER_MIME)} and ${parentQuery(root.id)} and ${driveQueryAppProperty(ROLE_KEY, role)}`,
      ...(signal === undefined ? {} : { signal }),
    });

    if (matches.length > 1) {
      throw new Error(`Google Drive contains multiple managed Cash-X/${section} folders.`);
    }

    const existing = matches[0];
    if (existing !== undefined) return existing;

    return this.drive.createMetadataFile(
      {
        name: section,
        mimeType: FOLDER_MIME,
        parents: [root.id],
        appProperties: {
          [ROLE_KEY]: role,
          [FORMAT_KEY]: FORMAT_VALUE,
        },
      },
      signal,
    );
  }

  private async ensureRootFolder(signal?: AbortSignal): Promise<DriveFile> {
    const matches = await this.drive.listFiles({
      spaces: 'drive',
      q: `trashed = false and ${driveQueryEquals('mimeType', FOLDER_MIME)} and ${parentQuery('root')} and ${driveQueryAppProperty(ROLE_KEY, ROLE_ROOT)}`,
      ...(signal === undefined ? {} : { signal }),
    });

    if (matches.length > 1) {
      throw new Error('Google Drive contains multiple managed Cash-X root folders.');
    }

    const existing = matches[0];
    if (existing !== undefined) return existing;

    return this.drive.createMetadataFile(
      {
        name: ROOT_FOLDER_NAME,
        mimeType: FOLDER_MIME,
        parents: ['root'],
        appProperties: {
          [ROLE_KEY]: ROLE_ROOT,
          [FORMAT_KEY]: FORMAT_VALUE,
        },
      },
      signal,
    );
  }

  private findObject(folderId: string, objectKey: string, signal?: AbortSignal): Promise<DriveFile[]> {
    return this.drive.listFiles({
      spaces: 'drive',
      q: `trashed = false and ${parentQuery(folderId)} and ${driveQueryAppProperty(ROLE_KEY, ROLE_VISIBLE_OBJECT)} and ${driveQueryAppProperty(OBJECT_KEY, objectKey)}`,
      ...(signal === undefined ? {} : { signal }),
    });
  }
}
