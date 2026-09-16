import type { BookRow } from '../../src/domain/persistence-types';
import { CashXDatabase } from '../../src/persistence/database';
import { LocalPersistence } from '../../src/persistence/local-persistence';

const PROBE_DATABASE_NAME = 'cash-x-android-runtime-probe';
const PROBE_BOOK_ID = 'android-webview-probe-book';
const PROBE_BOOK_NAME = 'Android WebView persistence probe';
const PROBE_INITIAL_BALANCE_MINOR = 12_345;

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

async function runProbe(): Promise<void> {
  const db = new CashXDatabase(PROBE_DATABASE_NAME);

  try {
    const persistence = new LocalPersistence(db);
    const existing = await persistence.getBook(PROBE_BOOK_ID);

    if (!existing) {
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

      await persistence.saveBook(book);

      const written = await persistence.getBook(PROBE_BOOK_ID);
      if (!written) {
        throw new Error('Android probe book was not readable after write.');
      }

      assertPersistedBook(written);
      publish('CASHX_PROBE_FIRST_LAUNCH');
      return;
    }

    assertPersistedBook(existing);
    publish('CASHX_PROBE_REOPEN_OK');
  } finally {
    db.close();
  }
}

void runProbe().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  publish(`CASHX_PROBE_ERROR:${message}`);
});
