import type {
  AttachmentRow,
  BookRow,
  CategoryRow,
  FinancialRecordRow,
  IsoTimestamp,
  MetaRow,
} from '../domain/persistence-types';
import { CashXDatabase, cashXSchemaVersion } from './database';

export interface CashXBackupV1 {
  format: 'cash-x-backup';
  formatVersion: 1;
  schemaVersion: number;
  exportedAt: IsoTimestamp;
  books: BookRow[];
  records: FinancialRecordRow[];
  categories: CategoryRow[];
  attachments: AttachmentRow[];
  meta: MetaRow[];
}

export class LocalPersistence {
  constructor(private readonly db: CashXDatabase) {}

  async saveBook(book: BookRow): Promise<void> {
    await this.db.books.put(book);
  }

  async saveCategory(category: CategoryRow): Promise<void> {
    await this.db.categories.put(category);
  }

  async saveRecord(record: FinancialRecordRow): Promise<void> {
    await this.db.records.put(record);
  }

  async getBook(id: string): Promise<BookRow | undefined> {
    return this.db.books.get(id);
  }

  async getRecord(id: string): Promise<FinancialRecordRow | undefined> {
    return this.db.records.get(id);
  }

  async listActiveRecords(bookId: string): Promise<FinancialRecordRow[]> {
    const records = await this.db.records.where('bookId').equals(bookId).toArray();
    return records
      .filter((record) => record.deletedAt === null)
      .sort((left, right) => {
        const byDate = left.businessDate.localeCompare(right.businessDate);
        if (byDate !== 0) return byDate;
        return left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
      });
  }

  async moveRecordToTrash(id: string, deletedAt: IsoTimestamp): Promise<void> {
    await this.db.transaction('rw', this.db.records, async () => {
      const record = await this.db.records.get(id);
      if (!record) throw new Error(`Record ${id} does not exist.`);
      await this.db.records.update(id, { deletedAt, updatedAt: deletedAt });
    });
  }

  async restoreRecord(id: string, restoredAt: IsoTimestamp): Promise<void> {
    await this.db.transaction('rw', this.db.records, async () => {
      const record = await this.db.records.get(id);
      if (!record) throw new Error(`Record ${id} does not exist.`);
      await this.db.records.update(id, { deletedAt: null, updatedAt: restoredAt });
    });
  }

  async exportBackup(exportedAt: IsoTimestamp): Promise<CashXBackupV1> {
    return this.db.transaction(
      'r',
      this.db.books,
      this.db.records,
      this.db.categories,
      this.db.attachments,
      this.db.meta,
      async () => ({
        format: 'cash-x-backup' as const,
        formatVersion: 1 as const,
        schemaVersion: cashXSchemaVersion,
        exportedAt,
        books: await this.db.books.toArray(),
        records: await this.db.records.toArray(),
        categories: await this.db.categories.toArray(),
        attachments: await this.db.attachments.toArray(),
        meta: await this.db.meta.toArray(),
      }),
    );
  }

  async restoreBackup(backup: CashXBackupV1): Promise<void> {
    if (backup.format !== 'cash-x-backup' || backup.formatVersion !== 1) {
      throw new Error('Unsupported Cash-X backup format.');
    }

    if (backup.schemaVersion > cashXSchemaVersion) {
      throw new Error('Backup was created by a newer Cash-X schema.');
    }

    await this.db.transaction(
      'rw',
      this.db.books,
      this.db.records,
      this.db.categories,
      this.db.attachments,
      this.db.meta,
      async () => {
        await this.db.books.bulkPut(backup.books);
        await this.db.records.bulkPut(backup.records);
        await this.db.categories.bulkPut(backup.categories);
        await this.db.attachments.bulkPut(backup.attachments);
        await this.db.meta.bulkPut(backup.meta);
      },
    );
  }
}
