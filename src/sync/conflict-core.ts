export type SyncEntityKind = 'book' | 'record' | 'category' | 'attachment' | 'setting';
export type SyncAction = 'upsert' | 'delete' | 'restore';

export interface VersionedSyncOperation<T = unknown> {
  operationId: string;
  deviceId: string;
  entityKind: SyncEntityKind;
  entityId: string;
  baseVersion: string | null;
  action: SyncAction;
  value: T | null;
}

export interface SyncConflict<T = unknown> {
  entityKind: SyncEntityKind;
  entityId: string;
  baseVersion: string | null;
  variants: VersionedSyncOperation<T>[];
}

export interface SyncResolution<T = unknown> {
  accepted: VersionedSyncOperation<T>[];
  conflicts: SyncConflict<T>[];
}

const operationOrder = <T>(a: VersionedSyncOperation<T>, b: VersionedSyncOperation<T>) =>
  a.operationId.localeCompare(b.operationId) || a.deviceId.localeCompare(b.deviceId);

const entityKey = (operation: VersionedSyncOperation) =>
  `${operation.entityKind}\u0000${operation.entityId}`;

export function resolveSyncOperations<T>(operations: VersionedSyncOperation<T>[]): SyncResolution<T> {
  const unique = new Map<string, VersionedSyncOperation<T>>();
  for (const operation of operations) {
    const existing = unique.get(operation.operationId);
    if (existing && JSON.stringify(existing) !== JSON.stringify(operation)) {
      throw new Error(`Operation identity collision: ${operation.operationId}`);
    }
    unique.set(operation.operationId, operation);
  }

  const byEntity = new Map<string, VersionedSyncOperation<T>[]>();
  for (const operation of unique.values()) {
    const key = entityKey(operation);
    const group = byEntity.get(key) ?? [];
    group.push(operation);
    byEntity.set(key, group);
  }

  const accepted: VersionedSyncOperation<T>[] = [];
  const conflicts: SyncConflict<T>[] = [];

  for (const group of byEntity.values()) {
    group.sort(operationOrder);
    const byBase = new Map<string, VersionedSyncOperation<T>[]>();
    for (const operation of group) {
      const baseKey = operation.baseVersion ?? '\u0000root';
      const siblings = byBase.get(baseKey) ?? [];
      siblings.push(operation);
      byBase.set(baseKey, siblings);
    }

    let conflicted = false;
    for (const siblings of byBase.values()) {
      const devices = new Set(siblings.map((operation) => operation.deviceId));
      if (siblings.length > 1 && devices.size > 1) {
        const variants = [...siblings].sort(operationOrder);
        conflicts.push({
          entityKind: variants[0].entityKind,
          entityId: variants[0].entityId,
          baseVersion: variants[0].baseVersion,
          variants,
        });
        conflicted = true;
      }
    }

    if (!conflicted) accepted.push(...group);
  }

  accepted.sort((a, b) => entityKey(a).localeCompare(entityKey(b)) || operationOrder(a, b));
  conflicts.sort((a, b) =>
    `${a.entityKind}\u0000${a.entityId}\u0000${a.baseVersion ?? ''}`.localeCompare(
      `${b.entityKind}\u0000${b.entityId}\u0000${b.baseVersion ?? ''}`,
    ),
  );

  return { accepted, conflicts };
}
