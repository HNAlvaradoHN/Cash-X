import type {
  AttachmentRow,
  BookRow,
  CategoryRow,
  FinancialRecordRow,
} from '../../src/domain/persistence-types';
import { CashXDatabase } from '../../src/persistence/database';
import { DexieAttachmentStore } from '../../src/persistence/dexie-attachment-store';
import { LocalPersistence } from '../../src/persistence/local-persistence';

const PROBE_DATABASE_NAME = 'cash-x-android-runtime-probe';
const PROBE_BOOK_ID = 'android-webview-probe-book';
const PROBE_BOOK_NAME = 'Android WebView persistence probe';
const PROBE_INITIAL_BALANCE_MINOR = 12_345;
const PROBE_CATEGORY_ID = 'android-webview-probe-category';
const PROBE_RECORD_ID = 'android-webview-probe-record';
const PROBE_ATTACHMENT_ID = 'android-webview-probe-attachment';
const PROBE_ATTACHMENT_BYTES = new Uint8Array([0x43, 0x41, 0x53, 0x48, 0x2d, 0x58, 0x00, 0xff]);

function publish(status: string): void {
  console.info(status);

  const root = document.querySelector<HTMLElement>('#app');
  if (root) {
    root.textContent = status;
    return;
  }

  document.body.textContent = status;
}

function assertPersistedBook(book: BookRow): void {
  if (
    book.id !== PROBE_BOOK_ID ||
    book.name !== PROBE_BOOK_NAME ||
    book.currency !== 'HNL' ||
    book.initialBalanceMinor !== PROBE_INITIAL_BALANCE_MINOR ||
    book.status !== 'active' ||
    book.deletedAt !== null
  ) {
    throw new Error('Persisted Android probe book failed integrity validation.');
  }
}

async function assertPersistedAttachment(attachment: AttachmentRow): Promise<void> {
  if (
    attachment.id !== PROBE_ATTACHMENT_ID ||
    attachment.recordId !== PROBE_RECORD_ID ||
    attachment.fileName !== 'android-probe.bin' ||
    attachment.mimeType !== 'application/octet-stream' ||
    attachment.sizeBytes !== PROBE_ATTACHMENT_BYTES.length ||
    attachment.blob.size !== PROBE_ATTACHMENT_BYTES.length ||
    attachment.deletedAt !== null
  ) {
    throw new Error('Persisted Android probe attachment metadata failed integrity validation.');
  }

  const bytes = new Uint8Array(await attachment.blob.arrayBuffer());
  if (
    bytes.length !== PROBE_ATTACHMENT_BYTES.length ||
    bytes.some((value, index) => value !== PROBE_ATTACHMENT_BYTES[index])
  ) {
    throw new Error('Persisted Android probe attachment bytes failed integrity validation.');
  }
}

async function seedProbeData(
  persistence: LocalPersistence,
  attachmentStore: DexieAttachmentStore,
): Promise<void> {
  const now = new Date().toISOString();
  const book: BookRow = {
    id: PROBE_BOOK_ID,
    name: PROBE_BOOK_NAME,
    currency: 'HNL',
    initialBalanceMinor: PROBE_INITIAL_BALANCE_MINOR,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const category: CategoryRow = {
    id: PROBE_CATEGORY_ID,
    bookId: PROBE_BOOK_ID,
    name: 'Android probe',
    active: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const record: FinancialRecordRow = {
    id: PROBE_RECORD_ID,
    bookId: PROBE_BOOK_ID,
    kind: 'expense',
    amountMinor: 1_00,
    description: 'Android Blob persistence probe',
    categoryId: PROBE_CATEGORY_ID,
    categoryLabelSnapshot: 'Android probe',
    businessDate: '2026-09-16',
    note: null,
    reference: null,
    additionalFieldOptionId: null,
    additionalFieldLabelSnapshot: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const blob = new Blob([PROBE_ATTACHMENT_BYTES], { type: 'application/octet-stream' });
  const attachment: AttachmentRow = {
    id: PROBE_ATTACHMENT_ID,
    recordId: PROBE_RECORD_ID,
    fileName: 'android-probe.bin',
    mimeType: 'application/octet-stream',
    sizeBytes: blob.size,
    sha256: 'android-probe-sha256',
    blob,
    createdAt: now,
    deletedAt: null,
  };

  await persistence.saveBook(book);
  await persistence.saveCategory(category);
  await persistence.saveRecord(record);
  await attachmentStore.save(attachment);
}

async function runProbe(): Promise<void> {
  const db = new CashXDatabase(PROBE_DATABASE_NAME);

  try {
    const persistence = new LocalPersistence(db);
    const attachmentStore = new DexieAttachmentStore(db);
    const existingAttachment = await attachmentStore.get(PROBE_ATTACHMENT_ID);

    if (!existingAttachment) {
      await seedProbeData(persistence, attachmentStore);

      const writtenBook = await persistence.getBook(PROBE_BOOK_ID);
      const writtenAttachment = await attachmentStore.get(PROBE_ATTACHMENT_ID);
      if (!writtenBook || !writtenAttachment) {
        throw new Error('Android probe data was not readable after write.');
      }

      assertPersistedBook(writtenBook);
      await assertPersistedAttachment(writtenAttachment);
      publish('CASHX_PROBE_FIRST_LAUNCH');
      return;
    }

    const existingBook = await persistence.getBook(PROBE_BOOK_ID);
    const existingRecord = await persistence.getRecord(PROBE_RECORD_ID);
    if (!existingBook || !existingRecord) {
      throw new Error('Android probe parent data was lost across app restart.');
    }

    assertPersistedBook(existingBook);
    await assertPersistedAttachment(existingAttachment);
    publish('CASHX_PROBE_REOPEN_OK');
  } finally {
    db.close();
  }
}

void runProbe().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  publish(`CASHX_PROBE_ERROR:${message}`);
});
