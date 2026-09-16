import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  AttachmentRow,
  BookRow,
  CategoryRow,
  FinancialRecordRow,
} from '../src/domain/persistence-types';
import {
  CASH_X_BACKUP_MIME,
  decodeCashXBackupFile,
} from '../src/backup/backup-file';
import { CashXBackupFileService } from '../src/backup/backup-file-service';
import { CashXDatabase } from '../src/persistence/database';
import { DexieAttachmentStore } from '../src/persistence/dexie-attachment-store';
import { LocalPersistence } from '../src/persistence/local-persistence';

const openDatabases = new Set<CashXDatabase>();
let sequence = 0;

function nextDbName(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

function makeBook(): BookRow {
  return {
    id: 'book-1',
    name: 'Caja para backup',
    currency: 'HNL',
    initialBalanceMinor: 500_00,
    status: 'active',
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:00.000Z',
    deletedAt: null,
  };
}

function makeCategory(): CategoryRow {
  return {
    id: 'category-1',
    bookId: 'book-1',
    name: 'Compras',
    active: true,
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:00.000Z',
    deletedAt: null,
  };
}

function makeRecord(): FinancialRecordRow {
  return {
    id: 'record-1',
    bookId: 'book-1',
    kind: 'expense',
    amountMinor: 125_50,
    description: 'Compra de prueba',
    categoryId: 'category-1',
    categoryLabelSnapshot: 'Compras',
    businessDate: '2026-09-16',
    note: 'Con comprobantes',
    reference: 'REF-001',
    additionalFieldOptionId: null,
    additionalFieldLabelSnapshot: null,
    createdAt: '2026-09-16T12:01:00.000Z',
    updatedAt: '2026-09-16T12:01:00.000Z',
    deletedAt: null,
  };
}

function makeAttachment(id: string, bytes: Uint8Array, fileName: string): AttachmentRow {
  const copy = Uint8Array.from(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/octet-stream' });
  return {
    id,
    recordId: 'record-1',
    fileName,
    mimeType: 'application/octet-stream',
    sizeBytes: blob.size,
    sha256: `metadata-${id}`,
    blob,
    createdAt: '2026-09-16T12:02:00.000Z',
    deletedAt: null,
  };
}

async function createDatabase(name: string): Promise<CashXDatabase> {
  const db = new CashXDatabase(name);
  openDatabases.add(db);
  await db.open();
  return db;
}

async function seedSource(db: CashXDatabase): Promise<Uint8Array> {
  const persistence = new LocalPersistence(db);
  await persistence.saveBook(makeBook());
  await persistence.saveCategory(makeCategory());
  await persistence.saveRecord(makeRecord());

  const largeBytes = new Uint8Array(256 * 1024);
  largeBytes[0] = 0x43;
  largeBytes[1024] = 0x58;
  largeBytes[largeBytes.length - 1] = 0x24;

  const store = new DexieAttachmentStore(db);
  await store.saveMany([
    makeAttachment('attachment-large', largeBytes, 'recibo.bin'),
    makeAttachment('attachment-trash', new Uint8Array([9, 8, 7, 6]), 'viejo.bin'),
  ]);
  await store.moveToTrash('attachment-trash', '2026-08-20T00:00:00.000Z');
  return largeBytes;
}

async function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

afterEach(async () => {
  const names = [...openDatabases].map((db) => db.name);
  for (const db of openDatabases) db.close();
  openDatabases.clear();
  await Promise.all(names.map((name) => Dexie.delete(name)));
});

describe('Cash-X external backup file', () => {
  it('transfers structured data and binary attachments to a second installation idempotently', async () => {
    const source = await createDatabase(nextDbName('backup-file-source'));
    const originalLargeBytes = await seedSource(source);
    const sourceService = new CashXBackupFileService(new LocalPersistence(source));

    const file = await sourceService.exportFile('2026-09-16T15:00:00.000Z');
    expect(file.type).toBe(CASH_X_BACKUP_MIME);
    expect(file.size).toBeGreaterThan(originalLargeBytes.byteLength);

    source.close();

    const target = await createDatabase(nextDbName('backup-file-target'));
    const targetService = new CashXBackupFileService(new LocalPersistence(target));
    await targetService.restoreFile(file);
    await targetService.restoreFile(file);

    await expect(target.books.count()).resolves.toBe(1);
    await expect(target.categories.count()).resolves.toBe(1);
    await expect(target.records.count()).resolves.toBe(1);
    await expect(target.attachments.count()).resolves.toBe(2);

    await expect(target.books.get('book-1')).resolves.toMatchObject({
      name: 'Caja para backup',
      initialBalanceMinor: 500_00,
    });

    const restoredLarge = await target.attachments.get('attachment-large');
    expect(restoredLarge).toBeDefined();
    expect(restoredLarge).toMatchObject({
      recordId: 'record-1',
      fileName: 'recibo.bin',
      sizeBytes: originalLargeBytes.byteLength,
      deletedAt: null,
    });
    expect(await readBytes(restoredLarge!.blob)).toEqual(originalLargeBytes);

    await expect(target.attachments.get('attachment-trash')).resolves.toMatchObject({
      deletedAt: '2026-08-20T00:00:00.000Z',
    });
  });

  it('rejects a backup whose manifest bytes were modified', async () => {
    const source = await createDatabase(nextDbName('backup-manifest-corruption'));
    await seedSource(source);
    const file = await new CashXBackupFileService(new LocalPersistence(source)).exportFile(
      '2026-09-16T15:00:00.000Z',
    );

    const bytes = new Uint8Array(await file.arrayBuffer());
    const firstManifestByte = 16 + 4 + 32;
    bytes[firstManifestByte] ^= 0x01;

    await expect(decodeCashXBackupFile(new Blob([bytes.buffer]))).rejects.toThrow(
      'manifest integrity check failed',
    );
  });

  it('rejects a backup whose attachment payload was modified or truncated', async () => {
    const source = await createDatabase(nextDbName('backup-payload-corruption'));
    await seedSource(source);
    const file = await new CashXBackupFileService(new LocalPersistence(source)).exportFile(
      '2026-09-16T15:00:00.000Z',
    );

    const corruptedBytes = new Uint8Array(await file.arrayBuffer());
    corruptedBytes[corruptedBytes.length - 1] ^= 0xff;
    await expect(decodeCashXBackupFile(new Blob([corruptedBytes.buffer]))).rejects.toThrow(
      'integrity check failed',
    );

    const truncated = file.slice(0, file.size - 1);
    await expect(decodeCashXBackupFile(truncated)).rejects.toThrow('payload size does not match');
  });
});
