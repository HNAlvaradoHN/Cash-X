import type { CashXDatabase } from '../persistence/database';
import type { VersionedSyncOperation } from './conflict-core';
import type { SyncOperationRow } from './persistent-sync-state';

export interface SyncQueueRow {
  operationId: string;
  queuedAt: string;
  attemptCount: number;
  nextAttemptAt: string | null;
  confirmedAt: string | null;
}

export interface SyncRetryPolicy {
  nextAttemptAt(attemptCount: number, now: Date): Date;
}

export const exponentialRetryPolicy: SyncRetryPolicy = {
  nextAttemptAt(attemptCount, now) {
    const seconds = Math.min(300, 2 ** Math.min(attemptCount, 8));
    return new Date(now.getTime() + seconds * 1000);
  },
};

const toOperation = (row: SyncOperationRow): VersionedSyncOperation => ({
  operationId: row.operationId,
  deviceId: row.deviceId,
  entityKind: row.entityKind,
  entityId: row.entityId,
  baseVersion: row.baseVersion,
  action: row.action,
  value: row.valueJson === null ? null : JSON.parse(row.valueJson),
});

export class OfflineSyncQueue {
  constructor(private readonly db: CashXDatabase) {}

  async enqueue(operationId: string, queuedAt = new Date()): Promise<void> {
    await this.db.transaction('rw', this.db.syncOperations, this.db.syncQueue, async () => {
      if (!(await this.db.syncOperations.get(operationId))) {
        throw new Error(`Cannot queue unknown operation: ${operationId}`);
      }
      const existing = await this.db.syncQueue.get(operationId);
      if (!existing) {
        await this.db.syncQueue.add({
          operationId,
          queuedAt: queuedAt.toISOString(),
          attemptCount: 0,
          nextAttemptAt: null,
          confirmedAt: null,
        });
      }
    });
  }

  async pendingBatch(limit: number, now = new Date()): Promise<VersionedSyncOperation[]> {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('Batch limit must be a positive integer');
    const rows = (await this.db.syncQueue.toArray())
      .filter((row) => row.confirmedAt === null && (row.nextAttemptAt === null || row.nextAttemptAt <= now.toISOString()))
      .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt) || a.operationId.localeCompare(b.operationId))
      .slice(0, limit);
    const operations = await this.db.syncOperations.bulkGet(rows.map((row) => row.operationId));
    return operations.map((row, index) => {
      if (!row) throw new Error(`Queued operation is missing: ${rows[index]?.operationId ?? 'unknown'}`);
      return toOperation(row);
    });
  }

  async confirm(operationIds: string[], confirmedAt = new Date()): Promise<void> {
    await this.db.transaction('rw', this.db.syncQueue, async () => {
      for (const operationId of [...new Set(operationIds)]) {
        const row = await this.db.syncQueue.get(operationId);
        if (!row || row.confirmedAt !== null) continue;
        await this.db.syncQueue.update(operationId, { confirmedAt: confirmedAt.toISOString(), nextAttemptAt: null });
      }
    });
  }

  async markRetry(operationIds: string[], policy: SyncRetryPolicy = exponentialRetryPolicy, now = new Date()): Promise<void> {
    await this.db.transaction('rw', this.db.syncQueue, async () => {
      for (const operationId of [...new Set(operationIds)]) {
        const row = await this.db.syncQueue.get(operationId);
        if (!row || row.confirmedAt !== null) continue;
        const attemptCount = row.attemptCount + 1;
        await this.db.syncQueue.update(operationId, {
          attemptCount,
          nextAttemptAt: policy.nextAttemptAt(attemptCount, now).toISOString(),
        });
      }
    });
  }

  async rows(): Promise<SyncQueueRow[]> {
    return this.db.syncQueue.toArray();
  }
}
