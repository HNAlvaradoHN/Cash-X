import { afterEach, describe, expect, it } from 'vitest';
import { CashXDatabase } from '../../src/persistence/database';
import { OfflineSyncQueue } from '../../src/sync/offline-sync-queue';
import { PersistentSyncState } from '../../src/sync/persistent-sync-state';
import type { VersionedSyncOperation } from '../../src/sync/conflict-core';

const databases: CashXDatabase[] = [];
const openDb = (name: string) => {
  const db = new CashXDatabase(name);
  databases.push(db);
  return db;
};

const operation = (operationId: string): VersionedSyncOperation => ({
  operationId,
  deviceId: 'device-a',
  entityKind: 'record',
  entityId: operationId,
  baseVersion: null,
  action: 'upsert',
  value: { amount: operationId },
});

const seed = async (db: CashXDatabase, ids: string[]) => {
  const state = new PersistentSyncState(db);
  await state.ingest(ids.map(operation));
  const queue = new OfflineSyncQueue(db);
  for (const [index, id] of ids.entries()) await queue.enqueue(id, new Date(1_000 + index));
  return queue;
};

afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await db.delete();
  }
});

describe('OfflineSyncQueue', () => {
  it('survives close/reopen and replays deterministically', async () => {
    const name = `cashx-queue-${crypto.randomUUID()}`;
    const first = openDb(name);
    await seed(first, ['op-b', 'op-a']);
    first.close();

    const reopened = openDb(name);
    const queue = new OfflineSyncQueue(reopened);
    expect((await queue.pendingBatch(10, new Date(10_000))).map((item) => item.operationId)).toEqual(['op-b', 'op-a']);
  });

  it('confirms only accepted operations and confirmation is idempotent', async () => {
    const db = openDb(`cashx-queue-${crypto.randomUUID()}`);
    const queue = await seed(db, ['op-a', 'op-b', 'op-c']);
    await queue.confirm(['op-a', 'op-c']);
    await queue.confirm(['op-a']);
    expect((await queue.pendingBatch(10)).map((item) => item.operationId)).toEqual(['op-b']);
    const rows = await queue.rows();
    expect(rows.filter((row) => row.confirmedAt !== null)).toHaveLength(2);
  });

  it('keeps failed operations pending until injected retry policy allows replay', async () => {
    const db = openDb(`cashx-queue-${crypto.randomUUID()}`);
    const queue = await seed(db, ['op-a']);
    const now = new Date('2026-09-17T00:00:00.000Z');
    await queue.markRetry(['op-a'], { nextAttemptAt: () => new Date(now.getTime() + 60_000) }, now);
    expect(await queue.pendingBatch(10, new Date(now.getTime() + 30_000))).toHaveLength(0);
    expect((await queue.pendingBatch(10, new Date(now.getTime() + 60_000))).map((item) => item.operationId)).toEqual(['op-a']);
  });

  it('rejects queue entries without an oplog operation', async () => {
    const db = openDb(`cashx-queue-${crypto.randomUUID()}`);
    const queue = new OfflineSyncQueue(db);
    await expect(queue.enqueue('missing')).rejects.toThrow('Cannot queue unknown operation');
  });
});
