import Dexie, { type EntityTable, type Transaction } from 'dexie';
import type {
  AttachmentRow,
  BookRow,
  CategoryRow,
  FinancialRecordRow,
  MetaRow,
} from '../domain/persistence-types';
import type { SyncQueueRow } from '../sync/offline-sync-queue';
import type { SyncConflictRow, SyncOperationRow } from '../sync/persistent-sync-state';

const STORES_V1 = {
  books: 'id, name, currency, updatedAt',
  records: 'id, bookId, businessDate, kind, deletedAt, [bookId+businessDate]',
  categories: 'id, bookId, active, name, [bookId+active]',
  attachments: 'id, recordId, createdAt',
  meta: 'key',
};

const STORES_V2 = {
  books: 'id, status, updatedAt, deletedAt',
  records: 'id, bookId, businessDate, kind, deletedAt, updatedAt, [bookId+businessDate]',
  categories: 'id, bookId, active, name, updatedAt, deletedAt, [bookId+active]',
  attachments: 'id, recordId, createdAt, deletedAt',
  meta: 'key',
};

const STORES_V3 = {
  ...STORES_V2,
  syncOperations: 'operationId, deviceId, entityKind, entityId, [entityKind+entityId]',
  syncConflicts: 'id, entityKind, entityId, [entityKind+entityId]',
};

const STORES_V4 = {
  ...STORES_V3,
  syncQueue: 'operationId, queuedAt, confirmedAt, nextAttemptAt',
};

type MutableLegacyRow = Record<string, unknown>;

function migrateToVersion2(transaction: Transaction): Promise<void> {
  const epoch = new Date(0).toISOString();

  return Promise.all([
    transaction.table('books').toCollection().modify((row: MutableLegacyRow) => {
      row.status ??= 'active';
      row.deletedAt ??= null;
    }),
    transaction.table('records').toCollection().modify((row: MutableLegacyRow) => {
      row.deletedAt ??= null;
      row.updatedAt ??= row.createdAt ?? epoch;
    }),
    transaction.table('categories').toCollection().modify((row: MutableLegacyRow) => {
      row.active ??= true;
      row.deletedAt ??= null;
      row.updatedAt ??= row.createdAt ?? epoch;
    }),
    transaction.table('attachments').toCollection().modify((row: MutableLegacyRow) => {
      row.deletedAt ??= null;
    }),
  ]).then(() => undefined);
}

export class CashXDatabase extends Dexie {
  books!: EntityTable<BookRow, 'id'>;
  records!: EntityTable<FinancialRecordRow, 'id'>;
  categories!: EntityTable<CategoryRow, 'id'>;
  attachments!: EntityTable<AttachmentRow, 'id'>;
  meta!: EntityTable<MetaRow, 'key'>;
  syncOperations!: EntityTable<SyncOperationRow, 'operationId'>;
  syncConflicts!: EntityTable<SyncConflictRow, 'id'>;
  syncQueue!: EntityTable<SyncQueueRow, 'operationId'>;

  constructor(name = 'cash-x') {
    super(name);

    this.version(1).stores(STORES_V1);
    this.version(2).stores(STORES_V2).upgrade(migrateToVersion2);
    this.version(3).stores(STORES_V3);
    this.version(4).stores(STORES_V4);
  }
}

export const cashXSchemaVersion = 4;
