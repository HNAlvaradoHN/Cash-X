import type {
  AttachmentRow,
  BookRow,
  CategoryRow,
  FinancialRecordRow,
  IsoTimestamp,
  MetaRow,
} from '../domain/persistence-types';
import type { CashXBackupV1 } from '../persistence/local-persistence';

const MAGIC_TEXT = 'CASHX-BACKUP-V1\n';
const MAGIC = new TextEncoder().encode(MAGIC_TEXT);
const MANIFEST_LENGTH_BYTES = 4;
const SHA256_BYTES = 32;
const HEADER_BYTES = MAGIC.byteLength + MANIFEST_LENGTH_BYTES + SHA256_BYTES;
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;

export const CASH_X_BACKUP_MIME = 'application/vnd.cash-x.backup';
export const CASH_X_BACKUP_EXTENSION = '.cashx';

interface BackupAttachmentManifestV1 {
  id: string;
  recordId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: IsoTimestamp;
  deletedAt: IsoTimestamp | null;
  offset: number;
  length: number;
  contentSha256: string;
}

interface BackupFileManifestV1 {
  fileFormat: 'cash-x-backup-file';
  fileVersion: 1;
  backupFormat: 'cash-x-backup';
  backupFormatVersion: 1;
  schemaVersion: number;
  exportedAt: IsoTimestamp;
  books: BookRow[];
  records: FinancialRecordRow[];
  categories: CategoryRow[];
  meta: MetaRow[];
  attachments: BackupAttachmentManifestV1[];
  payloadBytes: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value;
}

function requireString(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.trim().length === 0)) {
    throw new Error(`${label} must be a string${allowEmpty ? '' : ' and must not be empty'}.`);
  }
  return value;
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requireString(value, label, true);
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean.`);
  return value;
}

function requireSafeInteger(value: unknown, label: string, minimum?: number): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer.`);
  const numberValue = value as number;
  if (minimum !== undefined && numberValue < minimum) {
    throw new Error(`${label} must be at least ${minimum}.`);
  }
  return numberValue;
}

function requireTimestamp(value: unknown, label: string): IsoTimestamp {
  const timestamp = requireString(value, label);
  if (!Number.isFinite(Date.parse(timestamp))) throw new Error(`${label} must be an ISO timestamp.`);
  return timestamp;
}

function requireNullableTimestamp(value: unknown, label: string): IsoTimestamp | null {
  if (value === null) return null;
  return requireTimestamp(value, label);
}

function requireBusinessDate(value: unknown, label: string): string {
  const date = requireString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${label} must use YYYY-MM-DD.`);
  return date;
}

function parseBook(value: unknown, index: number): BookRow {
  const row = requireRecord(value, `books[${index}]`);
  const status = requireString(row.status, `books[${index}].status`);
  if (status !== 'active' && status !== 'archived') {
    throw new Error(`books[${index}].status is unsupported.`);
  }
  return {
    id: requireString(row.id, `books[${index}].id`),
    name: requireString(row.name, `books[${index}].name`),
    currency: requireString(row.currency, `books[${index}].currency`),
    initialBalanceMinor: requireSafeInteger(row.initialBalanceMinor, `books[${index}].initialBalanceMinor`),
    status,
    createdAt: requireTimestamp(row.createdAt, `books[${index}].createdAt`),
    updatedAt: requireTimestamp(row.updatedAt, `books[${index}].updatedAt`),
    deletedAt: requireNullableTimestamp(row.deletedAt, `books[${index}].deletedAt`),
  };
}

function parseRecord(value: unknown, index: number): FinancialRecordRow {
  const row = requireRecord(value, `records[${index}]`);
  const kind = requireString(row.kind, `records[${index}].kind`);
  if (kind !== 'income' && kind !== 'expense') {
    throw new Error(`records[${index}].kind is unsupported.`);
  }
  return {
    id: requireString(row.id, `records[${index}].id`),
    bookId: requireString(row.bookId, `records[${index}].bookId`),
    kind,
    amountMinor: requireSafeInteger(row.amountMinor, `records[${index}].amountMinor`, 1),
    description: requireString(row.description, `records[${index}].description`),
    categoryId: requireString(row.categoryId, `records[${index}].categoryId`),
    categoryLabelSnapshot: requireString(
      row.categoryLabelSnapshot,
      `records[${index}].categoryLabelSnapshot`,
    ),
    businessDate: requireBusinessDate(row.businessDate, `records[${index}].businessDate`),
    note: requireNullableString(row.note, `records[${index}].note`),
    reference: requireNullableString(row.reference, `records[${index}].reference`),
    additionalFieldOptionId: requireNullableString(
      row.additionalFieldOptionId,
      `records[${index}].additionalFieldOptionId`,
    ),
    additionalFieldLabelSnapshot: requireNullableString(
      row.additionalFieldLabelSnapshot,
      `records[${index}].additionalFieldLabelSnapshot`,
    ),
    createdAt: requireTimestamp(row.createdAt, `records[${index}].createdAt`),
    updatedAt: requireTimestamp(row.updatedAt, `records[${index}].updatedAt`),
    deletedAt: requireNullableTimestamp(row.deletedAt, `records[${index}].deletedAt`),
  };
}

function parseCategory(value: unknown, index: number): CategoryRow {
  const row = requireRecord(value, `categories[${index}]`);
  return {
    id: requireString(row.id, `categories[${index}].id`),
    bookId: requireString(row.bookId, `categories[${index}].bookId`),
    name: requireString(row.name, `categories[${index}].name`),
    active: requireBoolean(row.active, `categories[${index}].active`),
    createdAt: requireTimestamp(row.createdAt, `categories[${index}].createdAt`),
    updatedAt: requireTimestamp(row.updatedAt, `categories[${index}].updatedAt`),
    deletedAt: requireNullableTimestamp(row.deletedAt, `categories[${index}].deletedAt`),
  };
}

function parseMeta(value: unknown, index: number): MetaRow {
  const row = requireRecord(value, `meta[${index}]`);
  return {
    key: requireString(row.key, `meta[${index}].key`),
    value: requireString(row.value, `meta[${index}].value`, true),
  };
}

function parseAttachmentManifest(value: unknown, index: number): BackupAttachmentManifestV1 {
  const row = requireRecord(value, `attachments[${index}]`);
  return {
    id: requireString(row.id, `attachments[${index}].id`),
    recordId: requireString(row.recordId, `attachments[${index}].recordId`),
    fileName: requireString(row.fileName, `attachments[${index}].fileName`),
    mimeType: requireString(row.mimeType, `attachments[${index}].mimeType`),
    sizeBytes: requireSafeInteger(row.sizeBytes, `attachments[${index}].sizeBytes`, 0),
    sha256: requireString(row.sha256, `attachments[${index}].sha256`),
    createdAt: requireTimestamp(row.createdAt, `attachments[${index}].createdAt`),
    deletedAt: requireNullableTimestamp(row.deletedAt, `attachments[${index}].deletedAt`),
    offset: requireSafeInteger(row.offset, `attachments[${index}].offset`, 0),
    length: requireSafeInteger(row.length, `attachments[${index}].length`, 0),
    contentSha256: requireString(row.contentSha256, `attachments[${index}].contentSha256`).toLowerCase(),
  };
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${label} contains duplicate id/key ${value}.`);
    seen.add(value);
  }
}

function validateRelationships(backup: CashXBackupV1): void {
  assertUnique(backup.books.map((row) => row.id), 'books');
  assertUnique(backup.records.map((row) => row.id), 'records');
  assertUnique(backup.categories.map((row) => row.id), 'categories');
  assertUnique(backup.attachments.map((row) => row.id), 'attachments');
  assertUnique(backup.meta.map((row) => row.key), 'meta');

  const bookIds = new Set(backup.books.map((row) => row.id));
  const categoryIds = new Set(backup.categories.map((row) => row.id));
  const recordIds = new Set(backup.records.map((row) => row.id));

  for (const category of backup.categories) {
    if (!bookIds.has(category.bookId)) {
      throw new Error(`Category ${category.id} references missing book ${category.bookId}.`);
    }
  }

  for (const record of backup.records) {
    if (!bookIds.has(record.bookId)) {
      throw new Error(`Record ${record.id} references missing book ${record.bookId}.`);
    }
    if (!categoryIds.has(record.categoryId)) {
      throw new Error(`Record ${record.id} references missing category ${record.categoryId}.`);
    }
  }

  for (const attachment of backup.attachments) {
    if (!recordIds.has(attachment.recordId)) {
      throw new Error(
        `Attachment ${attachment.id} references missing record ${attachment.recordId}.`,
      );
    }
    if (attachment.sizeBytes !== attachment.blob.size) {
      throw new Error(`Attachment ${attachment.id} size metadata does not match its bytes.`);
    }
  }
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function sha256Bytes(input: Blob | Uint8Array): Promise<Uint8Array> {
  const bytes = input instanceof Blob ? new Uint8Array(await input.arrayBuffer()) : Uint8Array.from(input);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.buffer));
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: Blob | Uint8Array): Promise<string> {
  return toHex(await sha256Bytes(input));
}

function parseManifest(value: unknown): BackupFileManifestV1 {
  const manifest = requireRecord(value, 'manifest');
  if (manifest.fileFormat !== 'cash-x-backup-file' || manifest.fileVersion !== 1) {
    throw new Error('Unsupported Cash-X backup file format.');
  }
  if (manifest.backupFormat !== 'cash-x-backup' || manifest.backupFormatVersion !== 1) {
    throw new Error('Unsupported Cash-X backup payload format.');
  }

  return {
    fileFormat: 'cash-x-backup-file',
    fileVersion: 1,
    backupFormat: 'cash-x-backup',
    backupFormatVersion: 1,
    schemaVersion: requireSafeInteger(manifest.schemaVersion, 'manifest.schemaVersion', 1),
    exportedAt: requireTimestamp(manifest.exportedAt, 'manifest.exportedAt'),
    books: requireArray(manifest.books, 'manifest.books').map(parseBook),
    records: requireArray(manifest.records, 'manifest.records').map(parseRecord),
    categories: requireArray(manifest.categories, 'manifest.categories').map(parseCategory),
    meta: requireArray(manifest.meta, 'manifest.meta').map(parseMeta),
    attachments: requireArray(manifest.attachments, 'manifest.attachments').map(
      parseAttachmentManifest,
    ),
    payloadBytes: requireSafeInteger(manifest.payloadBytes, 'manifest.payloadBytes', 0),
  };
}

export async function encodeCashXBackupFile(backup: CashXBackupV1): Promise<Blob> {
  validateRelationships(backup);

  let payloadBytes = 0;
  const attachments: BackupAttachmentManifestV1[] = [];
  const payloadParts: Blob[] = [];

  for (const attachment of backup.attachments) {
    const length = attachment.blob.size;
    const nextPayloadSize = payloadBytes + length;
    if (!Number.isSafeInteger(nextPayloadSize)) {
      throw new Error('Cash-X backup payload is too large for this format.');
    }

    attachments.push({
      id: attachment.id,
      recordId: attachment.recordId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      sha256: attachment.sha256,
      createdAt: attachment.createdAt,
      deletedAt: attachment.deletedAt,
      offset: payloadBytes,
      length,
      contentSha256: await sha256Hex(attachment.blob),
    });
    payloadParts.push(attachment.blob);
    payloadBytes = nextPayloadSize;
  }

  const manifest: BackupFileManifestV1 = {
    fileFormat: 'cash-x-backup-file',
    fileVersion: 1,
    backupFormat: backup.format,
    backupFormatVersion: backup.formatVersion,
    schemaVersion: backup.schemaVersion,
    exportedAt: backup.exportedAt,
    books: backup.books,
    records: backup.records,
    categories: backup.categories,
    meta: backup.meta,
    attachments,
    payloadBytes,
  };

  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) {
    throw new Error('Cash-X backup manifest exceeds the supported size.');
  }

  const manifestDigest = await sha256Bytes(manifestBytes);
  const header = new Uint8Array(HEADER_BYTES);
  header.set(MAGIC, 0);
  new DataView(header.buffer).setUint32(MAGIC.byteLength, manifestBytes.byteLength, false);
  header.set(manifestDigest, MAGIC.byteLength + MANIFEST_LENGTH_BYTES);

  return new Blob([header, manifestBytes, ...payloadParts], { type: CASH_X_BACKUP_MIME });
}

export async function decodeCashXBackupFile(file: Blob): Promise<CashXBackupV1> {
  if (file.size < HEADER_BYTES) throw new Error('Cash-X backup file is truncated.');

  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());
  if (!bytesEqual(header.slice(0, MAGIC.byteLength), MAGIC)) {
    throw new Error('Unsupported Cash-X backup file header.');
  }

  const headerView = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const manifestLength = headerView.getUint32(MAGIC.byteLength, false);
  if (manifestLength > MAX_MANIFEST_BYTES) {
    throw new Error('Cash-X backup manifest exceeds the supported size.');
  }

  const manifestStart = HEADER_BYTES;
  const manifestEnd = manifestStart + manifestLength;
  if (manifestEnd > file.size) throw new Error('Cash-X backup file is truncated.');

  const expectedManifestDigest = header.slice(
    MAGIC.byteLength + MANIFEST_LENGTH_BYTES,
    HEADER_BYTES,
  );
  const manifestBytes = new Uint8Array(
    await file.slice(manifestStart, manifestEnd).arrayBuffer(),
  );
  const actualManifestDigest = await sha256Bytes(manifestBytes);
  if (!bytesEqual(expectedManifestDigest, actualManifestDigest)) {
    throw new Error('Cash-X backup manifest integrity check failed.');
  }

  let rawManifest: unknown;
  try {
    rawManifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  } catch {
    throw new Error('Cash-X backup manifest is not valid JSON.');
  }
  const manifest = parseManifest(rawManifest);

  if (file.size !== manifestEnd + manifest.payloadBytes) {
    throw new Error('Cash-X backup payload size does not match the manifest.');
  }

  let expectedOffset = 0;
  const attachmentRows: AttachmentRow[] = [];
  for (const attachment of manifest.attachments) {
    if (attachment.offset !== expectedOffset) {
      throw new Error(`Attachment ${attachment.id} has a non-contiguous payload offset.`);
    }
    if (attachment.length !== attachment.sizeBytes) {
      throw new Error(`Attachment ${attachment.id} payload length does not match size metadata.`);
    }

    const endOffset = attachment.offset + attachment.length;
    if (!Number.isSafeInteger(endOffset) || endOffset > manifest.payloadBytes) {
      throw new Error(`Attachment ${attachment.id} payload range is invalid.`);
    }

    const blob = file.slice(
      manifestEnd + attachment.offset,
      manifestEnd + endOffset,
      attachment.mimeType,
    );
    const contentSha256 = await sha256Hex(blob);
    if (contentSha256 !== attachment.contentSha256) {
      throw new Error(`Attachment ${attachment.id} integrity check failed.`);
    }

    attachmentRows.push({
      id: attachment.id,
      recordId: attachment.recordId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      sha256: attachment.sha256,
      blob,
      createdAt: attachment.createdAt,
      deletedAt: attachment.deletedAt,
    });
    expectedOffset = endOffset;
  }

  if (expectedOffset !== manifest.payloadBytes) {
    throw new Error('Cash-X backup payload contains unreferenced bytes.');
  }

  const backup: CashXBackupV1 = {
    format: 'cash-x-backup',
    formatVersion: 1,
    schemaVersion: manifest.schemaVersion,
    exportedAt: manifest.exportedAt,
    books: manifest.books,
    records: manifest.records,
    categories: manifest.categories,
    attachments: attachmentRows,
    meta: manifest.meta,
  };
  validateRelationships(backup);
  return backup;
}
