import { afterEach, describe, expect, it } from 'vitest';
import { CashXDatabase } from '../../src/persistence/database';
import { CloudSyncEngine } from '../../src/sync/cloud-sync-engine';
import type { CloudSyncProvider, RemoteSyncObject } from '../../src/sync/contracts';
import type { VersionedSyncOperation } from '../../src/sync/conflict-core';
import { OfflineSyncQueue } from '../../src/sync/offline-sync-queue';
import { PersistentSyncState } from '../../src/sync/persistent-sync-state';
import { RemoteSyncPull } from '../../src/sync/remote-sync-pull';

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

class MemoryCloudSyncProvider implements CloudSyncProvider {
  readonly objects = new Map<string, Blob>();
  failNextPut = false;
  private sequence = 0;

  async list(): Promise<RemoteSyncObject[]> {
    return [...this.objects.entries()].map(([key, blob]) => ({
      key,
      remoteId: `memory:${key}`,
      name: `${key}.json`,
      mimeType: blob.type,
      sizeBytes: blob.size,
      modifiedAt: null,
    }));
  }

  async put(key: string, payload: Blob): Promise<RemoteSyncObject> {
    if (this.failNextPut) {
      this.failNextPut = false;
      throw new Error('simulated cloud write failure');
    }
    this.sequence += 1;
    this.objects.set(key, payload);
    return {
      key,
      remoteId: `memory:${this.sequence}`,
      name: `${key}.json`,
      mimeType: payload.type,
      sizeBytes: payload.size,
      modifiedAt: `2026-09-17T12:00:${String(this.sequence).padStart(2, '0')}.000Z`,
    };
  }

  async get(key: string): Promise<Blob | null> {
    return this.objects.get(key) ?? null;
  }

  forcePut(key: string, payload: Blob): void {
    this.objects.set(key, payload);
  }
}

async function seedQueued(db: CashXDatabase, operations: VersionedSyncOperation[]): Promise<OfflineSyncQueue> {
  await new PersistentSyncState(db).ingest(operations);
  const queue = new OfflineSyncQueue(db);
  for (const [index, item] of operations.entries()) {
    await queue.enqueue(item.operationId, new Date(1_000 + index));
  }
  return queue;
}

const ids = async (db: CashXDatabase) =>
  (await new PersistentSyncState(db).operations()).map((item) => item.operationId).sort();

afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await db.delete();
  }
});

describe('CloudSyncEngine', () => {
  it('confirms queued operations only after the cloud snapshot is written', async () => {
    const db = openDb(`cashx-cloud-push-${crypto.randomUUID()}`);
    const cloud = new MemoryCloudSyncProvider();
    const queue = await seedQueued(db, [operation({ operationId: 'op-a', deviceId: 'device-a' })]);
    const engine = new CloudSyncEngine(db, cloud, 'device-a');

    cloud.failNextPut = true;
    await expect(engine.push()).rejects.toThrow('simulated cloud write failure');
    expect((await queue.pendingBatch(10)).map((item) => item.operationId)).toEqual(['op-a']);
    expect(cloud.objects.size).toBe(0);

    expect(await engine.push()).toBe(1);
    expect(await queue.pendingBatch(10)).toEqual([]);
    expect(cloud.objects.has('oplog:device-a')).toBe(true);
  });

  it('keeps an existing device snapshot monotonic after a local reinstall-like reset', async () => {
    const cloud = new MemoryCloudSyncProvider();
    const first = openDb(`cashx-device-a-old-${crypto.randomUUID()}`);
    await seedQueued(first, [operation({ operationId: 'op-old', deviceId: 'device-a' })]);
    await new CloudSyncEngine(first, cloud, 'device-a').push();
    first.close();

    const replacement = openDb(`cashx-device-a-new-${crypto.randomUUID()}`);
    await seedQueued(replacement, [operation({ operationId: 'op-new', deviceId: 'device-a' })]);
    await new CloudSyncEngine(replacement, cloud, 'device-a').push();

    const receiver = openDb(`cashx-device-b-${crypto.randomUUID()}`);
    expect(await new CloudSyncEngine(receiver, cloud, 'device-b').pull()).toBe(1);
    expect(await ids(receiver)).toEqual(['op-new', 'op-old']);
  });

  it('converges two offline devices through the cloud contract and preserves the same conflict on replay', async () => {
    const cloud = new MemoryCloudSyncProvider();
    const nameA = `cashx-cloud-a-${crypto.randomUUID()}`;
    const nameB = `cashx-cloud-b-${crypto.randomUUID()}`;
    const firstA = openDb(nameA);
    const firstB = openDb(nameB);

    const aShared = operation({
      operationId: 'a-shared',
      deviceId: 'device-a',
      entityId: 'shared-record',
      baseVersion: 'version-1',
      value: { amountMinor: 12_000 },
    });
    const bShared = operation({
      operationId: 'b-shared',
      deviceId: 'device-b',
      entityId: 'shared-record',
      baseVersion: 'version-1',
      value: { amountMinor: 13_000 },
    });
    await seedQueued(firstA, [aShared, operation({ operationId: 'a-only', deviceId: 'device-a' })]);
    await seedQueued(firstB, [bShared, operation({ operationId: 'b-only', deviceId: 'device-b' })]);

    expect(await new CloudSyncEngine(firstA, cloud, 'device-a').push()).toBe(2);
    expect(await new CloudSyncEngine(firstB, cloud, 'device-b').push()).toBe(2);
    firstA.close();
    firstB.close();

    const secondA = openDb(nameA);
    const secondB = openDb(nameB);
    const engineA = new CloudSyncEngine(secondA, cloud, 'device-a');
    const engineB = new CloudSyncEngine(secondB, cloud, 'device-b');
    expect(await engineA.pull()).toBe(1);
    expect(await engineB.pull()).toBe(1);
    secondA.close();
    secondB.close();

    const finalA = openDb(nameA);
    const finalB = openDb(nameB);
    const replayA = new CloudSyncEngine(finalA, cloud, 'device-a');
    const replayB = new CloudSyncEngine(finalB, cloud, 'device-b');
    expect(await replayA.pull()).toBe(1);
    expect(await replayB.pull()).toBe(1);

    const expectedIds = ['a-only', 'a-shared', 'b-only', 'b-shared'];
    expect(await ids(finalA)).toEqual(expectedIds);
    expect(await ids(finalB)).toEqual(expectedIds);
    expect(await finalA.syncOperations.count()).toBe(4);
    expect(await finalB.syncOperations.count()).toBe(4);

    const conflictsA = await new PersistentSyncState(finalA).conflicts();
    const conflictsB = await new PersistentSyncState(finalB).conflicts();
    expect(conflictsA).toEqual(conflictsB);
    expect(conflictsA).toHaveLength(1);
    expect(conflictsA[0]?.entityId).toBe('shared-record');
    expect(conflictsA[0]?.variants.map((item) => item.operationId)).toEqual(['a-shared', 'b-shared']);
  });

  it('does not advance a remote cursor or keep partial operations when a changed snapshot collides', async () => {
    const cloud = new MemoryCloudSyncProvider();
    const source = openDb(`cashx-cloud-source-${crypto.randomUUID()}`);
    const original = operation({
      operationId: 'shared-operation-id',
      deviceId: 'device-a',
      value: { amountMinor: 1_000 },
    });
    await seedQueued(source, [original]);
    await new CloudSyncEngine(source, cloud, 'device-a').push();

    const receiver = openDb(`cashx-cloud-receiver-${crypto.randomUUID()}`);
    const receiverEngine = new CloudSyncEngine(receiver, cloud, 'device-b');
    await receiverEngine.pull();
    const pull = new RemoteSyncPull(receiver);
    const committedCursor = await pull.cursor('oplog:device-a');
    expect(committedCursor).not.toBeNull();

    const corrupted = {
      format: 'cashx-sync-oplog',
      version: 1,
      deviceId: 'device-a',
      operations: [
        { ...original, value: { amountMinor: 9_999 } },
        operation({ operationId: 'remote-new', deviceId: 'device-a', value: { amountMinor: 2_000 } }),
      ],
    };
    cloud.forcePut(
      'oplog:device-a',
      new Blob([JSON.stringify(corrupted)], { type: 'application/vnd.cashx.sync+json' }),
    );

    await expect(receiverEngine.pull()).rejects.toThrow('Operation identity collision');
    expect(await pull.cursor('oplog:device-a')).toBe(committedCursor);
    expect(await ids(receiver)).toEqual(['shared-operation-id']);
    expect(await receiver.syncOperations.get('remote-new')).toBeUndefined();
  });

  it('rejects malformed remote content before changing local sync state', async () => {
    const cloud = new MemoryCloudSyncProvider();
    cloud.forcePut('oplog:device-a', new Blob(['not-json'], { type: 'application/json' }));
    const db = openDb(`cashx-cloud-invalid-${crypto.randomUUID()}`);
    const engine = new CloudSyncEngine(db, cloud, 'device-b');

    await expect(engine.pull()).rejects.toThrow('Sync snapshot contains invalid JSON');
    expect(await db.syncOperations.count()).toBe(0);
    expect(await new RemoteSyncPull(db).cursor('oplog:device-a')).toBeNull();
  });
});
