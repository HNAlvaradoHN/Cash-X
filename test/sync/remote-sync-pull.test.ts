import { afterEach, describe, expect, it } from 'vitest';
import { CashXDatabase } from '../../src/persistence/database';
import { PersistentSyncState } from '../../src/sync/persistent-sync-state';
import { RemoteSyncPull } from '../../src/sync/remote-sync-pull';
import type { VersionedSyncOperation } from '../../src/sync/conflict-core';

const databases: CashXDatabase[] = [];
const openDb = (name: string) => {
  const db = new CashXDatabase(name);
  databases.push(db);
  return db;
};

const operation = (operationId: string, deviceId = 'remote-a'): VersionedSyncOperation => ({
  operationId,
  deviceId,
  entityKind: 'record',
  entityId: operationId,
  baseVersion: null,
  action: 'upsert',
  value: { amount: operationId },
});

afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await db.delete();
  }
});

describe('RemoteSyncPull', () => {
  it('persists pagination cursor and operations across reopen', async () => {
    const name = `cashx-pull-${crypto.randomUUID()}`;
    const first = openDb(name);
    const pull = new RemoteSyncPull(first);
    await pull.applyPage({ remoteId: 'drive', expectedCursor: null, nextCursor: 'page-1', operations: [operation('op-1')] });
    await pull.applyPage({ remoteId: 'drive', expectedCursor: 'page-1', nextCursor: 'page-2', operations: [operation('op-2')] });
    expect(await pull.cursor('drive')).toBe('page-2');
    first.close();

    const reopened = openDb(name);
    expect(await new RemoteSyncPull(reopened).cursor('drive')).toBe('page-2');
    expect((await new PersistentSyncState(reopened).operations()).map((item) => item.operationId).sort()).toEqual(['op-1', 'op-2']);
  });

  it('replays an already committed page idempotently', async () => {
    const db = openDb(`cashx-pull-${crypto.randomUUID()}`);
    const pull = new RemoteSyncPull(db);
    const page = { remoteId: 'drive', expectedCursor: null, nextCursor: 'page-1', operations: [operation('op-1')] };
    await pull.applyPage(page);
    await pull.applyPage(page);
    expect(await pull.cursor('drive')).toBe('page-1');
    expect(await db.syncOperations.count()).toBe(1);
  });

  it('rolls back operations and cursor when any operation collides', async () => {
    const db = openDb(`cashx-pull-${crypto.randomUUID()}`);
    const state = new PersistentSyncState(db);
    await state.ingest([operation('op-existing')]);
    const pull = new RemoteSyncPull(db);

    await expect(pull.applyPage({
      remoteId: 'drive',
      expectedCursor: null,
      nextCursor: 'bad-page',
      operations: [operation('op-new'), { ...operation('op-existing'), value: { amount: 'changed' } }],
    })).rejects.toThrow('Operation identity collision');

    expect(await pull.cursor('drive')).toBeNull();
    expect((await state.operations()).map((item) => item.operationId)).toEqual(['op-existing']);
  });

  it('rejects out-of-order pages without changing state', async () => {
    const db = openDb(`cashx-pull-${crypto.randomUUID()}`);
    const pull = new RemoteSyncPull(db);
    await pull.applyPage({ remoteId: 'drive', expectedCursor: null, nextCursor: 'page-1', operations: [operation('op-1')] });

    await expect(pull.applyPage({ remoteId: 'drive', expectedCursor: 'wrong', nextCursor: 'page-2', operations: [operation('op-2')] }))
      .rejects.toThrow('Remote cursor mismatch');
    expect(await pull.cursor('drive')).toBe('page-1');
    expect(await db.syncOperations.count()).toBe(1);
  });
});
