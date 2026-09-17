import type { CashXDatabase } from '../persistence/database';
import { PersistentSyncState } from './persistent-sync-state';
import type { VersionedSyncOperation } from './conflict-core';

export interface RemoteSyncCursorRow {
  remoteId: string;
  cursor: string | null;
  updatedAt: string;
}

export interface RemoteSyncPage {
  remoteId: string;
  expectedCursor: string | null;
  nextCursor: string;
  operations: VersionedSyncOperation[];
}

export class RemoteSyncPull {
  constructor(private readonly db: CashXDatabase) {}

  async cursor(remoteId: string): Promise<string | null> {
    return (await this.db.remoteSyncCursors.get(remoteId))?.cursor ?? null;
  }

  async applyPage(page: RemoteSyncPage, now = new Date().toISOString()): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.remoteSyncCursors,
      this.db.syncOperations,
      this.db.syncConflicts,
      async () => {
        const current = (await this.db.remoteSyncCursors.get(page.remoteId))?.cursor ?? null;
        if (current === page.nextCursor) return;
        if (current !== page.expectedCursor) {
          throw new Error(
            `Remote cursor mismatch for ${page.remoteId}: expected ${page.expectedCursor ?? '<start>'}, got ${current ?? '<start>'}`,
          );
        }

        await new PersistentSyncState(this.db).ingest(page.operations);
        await this.db.remoteSyncCursors.put({
          remoteId: page.remoteId,
          cursor: page.nextCursor,
          updatedAt: now,
        });
      },
    );
  }
}
