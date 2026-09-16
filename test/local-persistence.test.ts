import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import type { BookRow, CategoryRow, FinancialRecordRow } from '../src/domain/persistence-types';
import { CashXDatabase } from '../src/persistence/database';
import { LocalPersistence } from '../src/persistence/local-persistence';

const openDatabases = new Set<CashXDatabase>();
let sequence = 0;

function nextDbName(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

function makeBook(id = 'book-1'): BookRow {
  return {
    id,
    name: 'Caja de prueba',
    currency: 'HNL',
    initialBalanceMinor: 100_00,
    status: 'active',
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:00.000Z',
    deletedAt: null,
  };
}

function makeCategory(id = 'category-1'): CategoryRow {
  return {
    id,
    bookId: 'book-1',
    name: 'Prueba',
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
    kind: 'income',
    amountMinor: 25_50,
    description: 'Ingreso de prueba',
    categoryId: 'category-1',
    categoryLabelSnapshot: 'Prueba',
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

async function createDatabase(name: string): Promise<CashXDatabase> {
  const db = new CashXDatabase(name);
  openDatabases.add(db);
  await db.open();
  return db;
}

afterEach(async () => {
  const names = [...openDatabases].map((db) => db.name);
  for (const db of openDatabases) db.close();
  openDatabases.clear();
  await Promise.all(names.map((name) => Dexie.delete(name)));
});

describe('Cash-X local persistence spike', () => {
  it('persists structured data across close and reopen', async () => {
    const name = nextDbName('reopen');
    const db = await createDatabase(name);
    const persistence = new LocalPersistence(db);

    await persistence.saveBook(makeBook());
    db.close();

    const reopened = new CashXDatabase(name);
    openDatabases.add(reopened);
    await reopened.open();

    await expect(new LocalPersistence(reopened).getBook('book-1')).resolves.toMatchObject({
      name: 'Caja de prueba',
      currency: 'HNL',
      initialBalanceMinor: 100_00,
    });
  });

  it('rolls back an atomic transaction when an operation fails', async () => {
    const db = await createDatabase(nextDbName('rollback'));

    await expect(
      db.transaction('rw', db.books, db.categories, async () => {
        await db.books.add(makeBook());
        await db.categories.add(makeCategory());
        throw new Error('simulated failure');
      }),
    ).rejects.toThrow('simulated failure');

    await expect(db.books.count()).resolves.toBe(0);
    await expect(db.categories.count()).resolves.toBe(0);
  });

  it('removes trashed records from active history and restores them', async () => {
    const db = await createDatabase(nextDbName('trash'));
    const persistence = new LocalPersistence(db);
    await persistence.saveBook(makeBook());
    await persistence.saveCategory(makeCategory());
    await persistence.saveRecord(makeRecord());

    expect(await persistence.listActiveRecords('book-1')).toHaveLength(1);

    await persistence.moveRecordToTrash('record-1', '2026-09-16T13:00:00.000Z');
    expect(await persistence.listActiveRecords('book-1')).toHaveLength(0);

    await persistence.restoreRecord('record-1', '2026-09-16T13:05:00.000Z');
    expect(await persistence.listActiveRecords('book-1')).toHaveLength(1);
  });

  it('migrates version 1 data without losing the book', async () => {
    const name = nextDbName('migration');
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      books: 'id, name, currency, updatedAt',
      records: 'id, bookId, businessDate, kind, deletedAt, [bookId+businessDate]',
      categories: 'id, bookId, active, name, [bookId+active]',
      attachments: 'id, recordId, createdAt',
      meta: 'key',
    });
    await legacy.open();
    await legacy.table('books').add({
      id: 'legacy-book',
      name: 'Legacy',
      currency: 'HNL',
      initialBalanceMinor: 0,
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-15T12:00:00.000Z',
    });
    legacy.close();

    const migrated = new CashXDatabase(name);
    openDatabases.add(migrated);
    await migrated.open();

    await expect(migrated.books.get('legacy-book')).resolves.toMatchObject({
      id: 'legacy-book',
      status: 'active',
      deletedAt: null,
    });
  });

  it('restores the same backup idempotently without duplicating records', async () => {
    const source = await createDatabase(nextDbName('backup-source'));
    const sourcePersistence = new LocalPersistence(source);
    await sourcePersistence.saveBook(makeBook());
    await sourcePersistence.saveCategory(makeCategory());
    await sourcePersistence.saveRecord(makeRecord());
    const backup = await sourcePersistence.exportBackup('2026-09-16T14:00:00.000Z');

    const target = await createDatabase(nextDbName('backup-target'));
    const targetPersistence = new LocalPersistence(target);
    await targetPersistence.restoreBackup(backup);
    await targetPersistence.restoreBackup(backup);

    await expect(target.books.count()).resolves.toBe(1);
    await expect(target.categories.count()).resolves.toBe(1);
    await expect(target.records.count()).resolves.toBe(1);
  });
});
