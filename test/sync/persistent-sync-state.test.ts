import { afterEach, describe, expect, it } from 'vitest';
import { CashXDatabase } from '../../src/persistence/database';
import { PersistentSyncState } from '../../src/sync/persistent-sync-state';
import type { VersionedSyncOperation } from '../../src/sync/conflict-core';

const databases: CashXDatabase[] = [];
const openDb = (name: string) => {
  const db = new CashXDatabase(name);
  databases.push(db);
  return db;
};

const operation = (operationId: string, deviceId: string, value: unknown): VersionedSyncOperation => ({
  operationId,
  deviceId,
  entityKind: 'record',
  entityId: 'record-1',
  baseVersion: 'v1',
  action: 'upsert',
  value,
});

afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await db.delete();
  }
});

describe('PersistentSyncState', () => {
  it('survives close/reopen and preserves conflicts', async () => {
    const name = `cashx-sync-${crypto.randomUUID()}`;
    const first = openDb(name);
    const state = new PersistentSyncState(first);
    await state.ingest([operation('op-a', 'device-a', { amount: 10 }), operation('op-b', 'device-b', { amount: 20 })]);
    expect(await state.conflicts()).toHaveLength(1);
    first.close();

    const reopened = openDb(name);
    const reopenedState = new PersistentSyncState(reopened);
    expect(await reopenedState.operations()).toHaveLength(2);
    expect(await reopenedState.conflicts()).toHaveLength(1);
  });

  it('is idempotent when the same remote operation is ingested repeatedly', async () => {
    const db = openDb(`cashx-sync-${crypto.randomUUID()}`);
    const state = new PersistentSyncState(db);
    const remote = operation('op-a', 'device-a', { amount: 10 });
    await state.ingest([remote]);
    await state.ingest([remote]);
    expect(await state.operations()).toHaveLength(1);
  });

  it('rolls back the whole ingest on an operation identity collision', async () => {
    const db = openDb(`cashx-sync-${crypto.randomUUID()}`);
    const state = new PersistentSyncState(db);
    await state.ingest([operation('op-a', 'device-a', { amount: 10 })]);

    await expect(state.ingest([
      operation('op-b', 'device-b', { amount: 20 }),
      operation('op-a', 'device-a', { amount: 99 }),
    ])).rejects.toThrow('Operation identity collision');

    expect((await state.operations()).map((item) => item.operationId)).toEqual(['op-a']);
    expect(await state.conflicts()).toHaveLength(0);
  });
});
