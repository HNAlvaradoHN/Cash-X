import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  AttachmentRow,
  BookRow,
  CategoryRow,
  FinancialRecordRow,
} from '../src/domain/persistence-types';
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
    name: 'Caja de comprobantes',
    currency: 'HNL',
    initialBalanceMinor: 0,
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
    name: 'Comprobantes',
    active: true,
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:00.000Z',
    deletedAt: null,
  };
}

function makeRecord(id = 'record-1'): FinancialRecordRow {
  return {
    id,
    bookId: 'book-1',
    kind: 'expense',
    amountMinor: 150_00,
    description: 'Compra con comprobante',
    categoryId: 'category-1',
    categoryLabelSnapshot: 'Comprobantes',
    businessDate: '2026-09-16',
    note: null,
    reference: null,
    additionalFieldOptionId: null,
    additionalFieldLabelSnapshot: null,
    createdAt: '2026-09-16T12:01:00.000Z',
    updatedAt: '2026-09-16T12:01:00.000Z',
    deletedAt: null,
  };
}

function makeAttachment(
  id: string,
  bytes: Uint8Array,
  options: { recordId?: string; createdAt?: string; fileName?: string } = {},
): AttachmentRow {
  const byteCopy = Uint8Array.from(bytes);
  const blob = new Blob([byteCopy.buffer], { type: 'application/octet-stream' });
  return {
    id,
    recordId: options.recordId ?? 'record-1',
    fileName: options.fileName ?? `${id}.bin`,
    mimeType: 'application/octet-stream',
    sizeBytes: blob.size,
    sha256: `sha256-${id}`,
    blob,
    createdAt: options.createdAt ?? '2026-09-16T12:02:00.000Z',
    deletedAt: null,
  };
}

async function createDatabase(name: string): Promise<CashXDatabase> {
  const db = new CashXDatabase(name);
  openDatabases.add(db);
  await db.open();
  return db;
}

async function seedRecord(db: CashXDatabase): Promise<void> {
  const persistence = new LocalPersistence(db);
  await persistence.saveBook(makeBook());
  await persistence.saveCategory(makeCategory());
  await persistence.saveRecord(makeRecord());
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

describe('Cash-X attachment Blob storage spike', () => {
  it('persists Blob bytes and metadata across close and reopen', async () => {
    const name = nextDbName('attachment-reopen');
    const db = await createDatabase(name);
    await seedRecord(db);

    const bytes = new Uint8Array(1024 * 1024);
    bytes[0] = 0x43;
    bytes[bytes.length - 1] = 0x58;

    const store = new DexieAttachmentStore(db);
    await store.save(makeAttachment('attachment-large', bytes, { fileName: 'recibo.bin' }));
    db.close();

    const reopened = new CashXDatabase(name);
    openDatabases.add(reopened);
    await reopened.open();

    const persisted = await new DexieAttachmentStore(reopened).get('attachment-large');
    expect(persisted).toBeDefined();
    expect(persisted).toMatchObject({
      recordId: 'record-1',
      fileName: 'recibo.bin',
      mimeType: 'application/octet-stream',
      sizeBytes: 1024 * 1024,
      deletedAt: null,
    });

    const persistedBytes = await readBytes(persisted!.blob);
    expect(persistedBytes).toHaveLength(bytes.length);
    expect(persistedBytes[0]).toBe(0x43);
    expect(persistedBytes[persistedBytes.length - 1]).toBe(0x58);
  });

  it('supports multiple active attachments per financial record in stable order', async () => {
    const db = await createDatabase(nextDbName('attachment-list'));
    await seedRecord(db);
    const store = new DexieAttachmentStore(db);

    await store.saveMany([
      makeAttachment('attachment-b', new Uint8Array([2]), {
        createdAt: '2026-09-16T12:03:00.000Z',
      }),
      makeAttachment('attachment-a', new Uint8Array([1]), {
        createdAt: '2026-09-16T12:02:00.000Z',
      }),
    ]);

    await expect(store.listActive('record-1')).resolves.toMatchObject([
      { id: 'attachment-a' },
      { id: 'attachment-b' },
    ]);
  });

  it('rejects orphan attachments and leaves no binary residue', async () => {
    const db = await createDatabase(nextDbName('attachment-orphan'));
    await seedRecord(db);
    const store = new DexieAttachmentStore(db);

    await expect(
      store.save(
        makeAttachment('attachment-orphan', new Uint8Array([1, 2, 3]), {
          recordId: 'missing-record',
        }),
      ),
    ).rejects.toThrow('does not exist');

    await expect(db.attachments.count()).resolves.toBe(0);
  });

  it('rolls back the full attachment batch when IndexedDB rejects one write', async () => {
    const db = await createDatabase(nextDbName('attachment-rollback'));
    await seedRecord(db);
    const store = new DexieAttachmentStore(db);

    const first = makeAttachment('duplicate-id', new Uint8Array([1]));
    const duplicate = makeAttachment('duplicate-id', new Uint8Array([2]));

    await expect(store.saveMany([first, duplicate])).rejects.toThrow();
    await expect(db.attachments.count()).resolves.toBe(0);
  });

  it('moves attachments to Trash, restores them, and purges expired deleted data', async () => {
    const db = await createDatabase(nextDbName('attachment-trash'));
    await seedRecord(db);
    const store = new DexieAttachmentStore(db);

    await store.save(makeAttachment('attachment-1', new Uint8Array([1])));
    await store.moveToTrash('attachment-1', '2026-08-01T00:00:00.000Z');
    await expect(store.listActive('record-1')).resolves.toHaveLength(0);

    await store.restore('attachment-1');
    await expect(store.listActive('record-1')).resolves.toHaveLength(1);

    await expect(store.deletePermanently('attachment-1')).rejects.toThrow(
      'must be in Trash',
    );

    await store.moveToTrash('attachment-1', '2026-08-01T00:00:00.000Z');
    await expect(store.purgeDeletedOnOrBefore('2026-08-31T23:59:59.999Z')).resolves.toBe(1);
    await expect(store.get('attachment-1')).resolves.toBeUndefined();
  });

  it('rejects Blob metadata that does not match the stored bytes', async () => {
    const db = await createDatabase(nextDbName('attachment-integrity'));
    await seedRecord(db);
    const store = new DexieAttachmentStore(db);
    const attachment = makeAttachment('attachment-invalid-size', new Uint8Array([1, 2, 3]));

    attachment.sizeBytes = 999;
    await expect(store.save(attachment)).rejects.toThrow('does not match Blob size');
    await expect(db.attachments.count()).resolves.toBe(0);
  });
});
