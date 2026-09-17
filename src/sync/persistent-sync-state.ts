import type { CashXDatabase } from '../persistence/database';
import { resolveSyncOperations, type SyncConflict, type VersionedSyncOperation } from './conflict-core';

export interface SyncOperationRow {
  operationId: string;
  deviceId: string;
  entityKind: VersionedSyncOperation['entityKind'];
  entityId: string;
  baseVersion: string | null;
  action: VersionedSyncOperation['action'];
  valueJson: string | null;
}

export interface SyncConflictRow {
  id: string;
  entityKind: VersionedSyncOperation['entityKind'];
  entityId: string;
  baseVersion: string | null;
  variantsJson: string;
}

const conflictId = (conflict: SyncConflict) =>
  `${conflict.entityKind}\u0000${conflict.entityId}\u0000${conflict.baseVersion ?? ''}`;

const toOperation = (row: SyncOperationRow): VersionedSyncOperation => ({
  operationId: row.operationId,
  deviceId: row.deviceId,
  entityKind: row.entityKind,
  entityId: row.entityId,
  baseVersion: row.baseVersion,
  action: row.action,
  value: row.valueJson === null ? null : JSON.parse(row.valueJson),
});

const toRow = (operation: VersionedSyncOperation): SyncOperationRow => ({
  operationId: operation.operationId,
  deviceId: operation.deviceId,
  entityKind: operation.entityKind,
  entityId: operation.entityId,
  baseVersion: operation.baseVersion,
  action: operation.action,
  valueJson: operation.value === null ? null : JSON.stringify(operation.value),
});

export class PersistentSyncState {
  constructor(private readonly db: CashXDatabase) {}

  async ingest(operations: VersionedSyncOperation[]): Promise<void> {
    await this.db.transaction('rw', this.db.syncOperations, this.db.syncConflicts, async () => {
      for (const operation of operations) {
        const existing = await this.db.syncOperations.get(operation.operationId);
        const row = toRow(operation);
        if (existing && JSON.stringify(existing) !== JSON.stringify(row)) {
          throw new Error(`Operation identity collision: ${operation.operationId}`);
        }
        if (!existing) await this.db.syncOperations.add(row);
      }

      const all = (await this.db.syncOperations.toArray()).map(toOperation);
      const resolution = resolveSyncOperations(all);
      await this.db.syncConflicts.clear();
      if (resolution.conflicts.length > 0) {
        await this.db.syncConflicts.bulkAdd(
          resolution.conflicts.map((conflict) => ({
            id: conflictId(conflict),
            entityKind: conflict.entityKind,
            entityId: conflict.entityId,
            baseVersion: conflict.baseVersion,
            variantsJson: JSON.stringify(conflict.variants),
          })),
        );
      }
    });
  }

  async operations(): Promise<VersionedSyncOperation[]> {
    return (await this.db.syncOperations.toArray()).map(toOperation);
  }

  async conflicts(): Promise<SyncConflict[]> {
    return (await this.db.syncConflicts.toArray()).map((row) => ({
      entityKind: row.entityKind,
      entityId: row.entityId,
      baseVersion: row.baseVersion,
      variants: JSON.parse(row.variantsJson) as VersionedSyncOperation[],
    }));
  }
}
