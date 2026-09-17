import { afterEach, describe, expect, it } from 'vitest';
import { CashXDatabase } from '../../src/persistence/database';
import type { VersionedSyncOperation } from '../../src/sync/conflict-core';
import { OfflineSyncQueue } from '../../src/sync/offline-sync-queue';
import { PersistentSyncState } from '../../src/sync/persistent-sync-state';
import { RemoteSyncPull, type RemoteSyncPage } from '../../src/sync/remote-sync-pull';

const databases: CashXDatabase[] = [];

const openDb = (name: string) => {
  const db = new CashXDatabase(name);
  databases.push(db);
  return db;
};

const operation = ({
  operationId,
  deviceId,
  entityId = operationId,
  baseVersion = null,
  value = { operationId },
}: {
  operationId: string;
  deviceId: string;
  entityId?: string;
  baseVersion?: string | null;
  value?: unknown;
}): VersionedSyncOperation => ({
  operationId,
  deviceId,
  entityKind: 'record',
  entityId,
  baseVersion,
  action: 'upsert',
  value,
});

class SimulatedRelay {
  private readonly operationsById = new Map<string, VersionedSyncOperation>();

  push(operations: VersionedSyncOperation[]): string[] {
    for (const item of operations) {
      const existing = this.operationsById.get(item.operationId);
      if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
        throw new Error(`Relay operation identity collision: ${item.operationId}`);
      }
      this.operationsById.set(item.operationId, item);
    }
    return operations.map((item) => item.operationId);
  }

  page(remoteId: string, expectedCursor: string | null, nextCursor: string): RemoteSyncPage {
    return {
      remoteId,
      expectedCursor,
      nextCursor,
      operations: [...this.operationsById.values()].sort((a, b) => a.operationId.localeCompare(b.operationId)),
    };
  }
}

async function seedQueuedOperations(
  db: CashXDatabase,
  operations: VersionedSyncOperation[],
): Promise<OfflineSyncQueue> {
  await new PersistentSyncState(db).ingest(operations);
  const queue = new OfflineSyncQueue(db);
  for (const [index, item] of operations.entries()) {
    await queue.enqueue(item.operationId, new Date(1_000 + index));
  }
  return queue;
}

afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await db.delete();
  }
});

describe('sync recovery integration', () => {
  it('preserves partial acknowledgements, retry timing and deterministic pending order across restart', async () => {
    const name = `cashx-recovery-queue-${crypto.randomUUID()}`;
    const first = openDb(name);
    const queue = await seedQueuedOperations(first, [
      operation({ operationId: 'op-a', deviceId: 'device-a' }),
      operation({ operationId: 'op-b', deviceId: 'device-a' }),
      operation({ operationId: 'op-c', deviceId: 'device-a' }),
    ]);

    const retryStart = new Date('2026-09-17T12:00:00.000Z');
    await queue.confirm(['op-a'], new Date('2026-09-17T11:59:00.000Z'));
    await queue.markRetry(
      ['op-b'],
      { nextAttemptAt: () => new Date(retryStart.getTime() + 60_000) },
      retryStart,
    );
    first.close();

    const reopened = openDb(name);
    const reopenedQueue = new OfflineSyncQueue(reopened);
    expect(
      (await reopenedQueue.pendingBatch(10, new Date(retryStart.getTime() + 30_000))).map((item) => item.operationId),
    ).toEqual(['op-c']);
    expect(
      (await reopenedQueue.pendingBatch(10, new Date(retryStart.getTime() + 60_000))).map((item) => item.operationId),
    ).toEqual(['op-b', 'op-c']);

    await reopenedQueue.confirm(['op-b', 'op-c'], new Date('2026-09-17T12:02:00.000Z'));
    reopened.close();

    const verified = openDb(name);
    const verifiedQueue = new OfflineSyncQueue(verified);
    expect(await verifiedQueue.pendingBatch(10, new Date('2026-09-18T00:00:00.000Z'))).toEqual([]);
    expect((await verifiedQueue.rows()).filter((row) => row.confirmedAt !== null)).toHaveLength(3);
  });

  it('converges two offline devices after restart and replay without duplicating operations or hiding conflicts', async () => {
    const nameA = `cashx-device-a-${crypto.randomUUID()}`;
    const nameB = `cashx-device-b-${crypto.randomUUID()}`;
    const relayA = new SimulatedRelay();
    const relayB = new SimulatedRelay();

    const aConflict = operation({
      operationId: 'a-shared-edit',
      deviceId: 'device-a',
      entityId: 'shared-record',
      baseVersion: 'version-1',
      value: { amountMinor: 12_000 },
    });
    const bConflict = operation({
      operationId: 'b-shared-edit',
      deviceId: 'device-b',
      entityId: 'shared-record',
      baseVersion: 'version-1',
      value: { amountMinor: 13_000 },
    });
    const aOnly = operation({ operationId: 'a-only', deviceId: 'device-a', value: { amountMinor: 500 } });
    const bOnly = operation({ operationId: 'b-only', deviceId: 'device-b', value: { amountMinor: 700 } });

    const firstA = openDb(nameA);
    const firstB = openDb(nameB);
    const queueA = await seedQueuedOperations(firstA, [aConflict, aOnly]);
    const queueB = await seedQueuedOperations(firstB, [bConflict, bOnly]);

    const sentA = await queueA.pendingBatch(10, new Date('2026-09-17T13:00:00.000Z'));
    const sentB = await queueB.pendingBatch(10, new Date('2026-09-17T13:00:00.000Z'));
    await queueA.confirm(relayA.push(sentA), new Date('2026-09-17T13:00:01.000Z'));
    await queueB.confirm(relayB.push(sentB), new Date('2026-09-17T13:00:01.000Z'));
    firstA.close();
    firstB.close();

    const secondA = openDb(nameA);
    const secondB = openDb(nameB);
    expect(await new OfflineSyncQueue(secondA).pendingBatch(10)).toEqual([]);
    expect(await new OfflineSyncQueue(secondB).pendingBatch(10)).toEqual([]);

    const pageForA = relayB.page('device-b', null, 'device-b:page-1');
    const pageForB = relayA.page('device-a', null, 'device-a:page-1');
    await new RemoteSyncPull(secondA).applyPage(pageForA, '2026-09-17T13:01:00.000Z');
    await new RemoteSyncPull(secondB).applyPage(pageForB, '2026-09-17T13:01:00.000Z');
    secondA.close();
    secondB.close();

    const finalA = openDb(nameA);
    const finalB = openDb(nameB);
    const pullA = new RemoteSyncPull(finalA);
    const pullB = new RemoteSyncPull(finalB);

    await pullA.applyPage(pageForA, '2026-09-17T13:02:00.000Z');
    await pullB.applyPage(pageForB, '2026-09-17T13:02:00.000Z');

    const stateA = new PersistentSyncState(finalA);
    const stateB = new PersistentSyncState(finalB);
    const operationIdsA = (await stateA.operations()).map((item) => item.operationId).sort();
    const operationIdsB = (await stateB.operations()).map((item) => item.operationId).sort();
    expect(operationIdsA).toEqual(['a-only', 'a-shared-edit', 'b-only', 'b-shared-edit']);
    expect(operationIdsB).toEqual(operationIdsA);
    expect(await finalA.syncOperations.count()).toBe(4);
    expect(await finalB.syncOperations.count()).toBe(4);

    const conflictsA = await stateA.conflicts();
    const conflictsB = await stateB.conflicts();
    expect(conflictsA).toEqual(conflictsB);
    expect(conflictsA).toHaveLength(1);
    expect(conflictsA[0]?.entityId).toBe('shared-record');
    expect(conflictsA[0]?.variants.map((item) => item.operationId)).toEqual(['a-shared-edit', 'b-shared-edit']);
    expect(await pullA.cursor('device-b')).toBe('device-b:page-1');
    expect(await pullB.cursor('device-a')).toBe('device-a:page-1');
  });

  it('keeps the last committed cursor and rolls back new operations when a later page collides', async () => {
    const name = `cashx-recovery-pull-${crypto.randomUUID()}`;
    const first = openDb(name);
    const pull = new RemoteSyncPull(first);
    const original = operation({ operationId: 'remote-existing', deviceId: 'device-b', value: { amountMinor: 1_000 } });

    await pull.applyPage(
      {
        remoteId: 'device-b',
        expectedCursor: null,
        nextCursor: 'device-b:page-1',
        operations: [original],
      },
      '2026-09-17T14:00:00.000Z',
    );

    await expect(
      pull.applyPage(
        {
          remoteId: 'device-b',
          expectedCursor: 'device-b:page-1',
          nextCursor: 'device-b:page-2',
          operations: [
            operation({ operationId: 'remote-new', deviceId: 'device-b', value: { amountMinor: 2_000 } }),
            { ...original, value: { amountMinor: 9_999 } },
          ],
        },
        '2026-09-17T14:01:00.000Z',
      ),
    ).rejects.toThrow('Operation identity collision');
    first.close();

    const reopened = openDb(name);
    const reopenedPull = new RemoteSyncPull(reopened);
    expect(await reopenedPull.cursor('device-b')).toBe('device-b:page-1');
    expect((await new PersistentSyncState(reopened).operations()).map((item) => item.operationId)).toEqual(['remote-existing']);
    expect(await reopened.syncOperations.get('remote-new')).toBeUndefined();
  });
});
