import { describe, expect, it } from 'vitest';
import { resolveSyncOperations, type VersionedSyncOperation } from '../../src/sync/conflict-core';

type Value = { description: string };

const op = (overrides: Partial<VersionedSyncOperation<Value>>): VersionedSyncOperation<Value> => ({
  operationId: 'op-a',
  deviceId: 'device-a',
  entityKind: 'record',
  entityId: 'record-1',
  baseVersion: 'v1',
  action: 'upsert',
  value: { description: 'A' },
  ...overrides,
});

describe('resolveSyncOperations', () => {
  it('is idempotent when the same operation is received repeatedly', () => {
    const operation = op({});
    const result = resolveSyncOperations([operation, operation, operation]);
    expect(result.conflicts).toEqual([]);
    expect(result.accepted).toEqual([operation]);
  });

  it('merges changes to independent entities', () => {
    const first = op({ operationId: 'op-a', entityId: 'record-1' });
    const second = op({ operationId: 'op-b', deviceId: 'device-b', entityId: 'record-2' });
    const result = resolveSyncOperations([second, first]);
    expect(result.conflicts).toEqual([]);
    expect(result.accepted).toEqual([first, second]);
  });

  it('preserves concurrent edits from the same base as an explicit conflict', () => {
    const first = op({ operationId: 'op-a', deviceId: 'device-a', value: { description: 'A' } });
    const second = op({ operationId: 'op-b', deviceId: 'device-b', value: { description: 'B' } });
    const result = resolveSyncOperations([second, first]);
    expect(result.accepted).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.variants).toEqual([first, second]);
  });

  it('does not silently let delete or restore win over a concurrent edit', () => {
    const deletion = op({ operationId: 'op-delete', deviceId: 'device-a', action: 'delete', value: null });
    const edit = op({ operationId: 'op-edit', deviceId: 'device-b', action: 'upsert', value: { description: 'edited offline' } });
    const result = resolveSyncOperations([deletion, edit]);
    expect(result.accepted).toEqual([]);
    expect(result.conflicts[0]?.variants.map((variant) => variant.action).sort()).toEqual(['delete', 'upsert']);

    const restore = op({ operationId: 'op-restore', deviceId: 'device-a', action: 'restore', value: { description: 'restored' } });
    const concurrentEdit = op({ operationId: 'op-new-edit', deviceId: 'device-b', action: 'upsert', value: { description: 'changed' } });
    expect(resolveSyncOperations([restore, concurrentEdit]).conflicts).toHaveLength(1);
  });

  it('returns the same deterministic resolution regardless of delivery order', () => {
    const operations = [
      op({ operationId: 'op-c', entityId: 'record-2', deviceId: 'device-c' }),
      op({ operationId: 'op-b', deviceId: 'device-b', value: { description: 'B' } }),
      op({ operationId: 'op-a', deviceId: 'device-a', value: { description: 'A' } }),
    ];
    expect(resolveSyncOperations(operations)).toEqual(resolveSyncOperations([...operations].reverse()));
  });

  it('rejects reuse of an operation id for different content', () => {
    expect(() => resolveSyncOperations([
      op({ operationId: 'same', value: { description: 'A' } }),
      op({ operationId: 'same', value: { description: 'B' } }),
    ])).toThrow('Operation identity collision: same');
  });
});
