import type { CashXDatabase } from '../persistence/database';
import type { CloudSyncProvider } from './contracts';
import type { SyncAction, SyncEntityKind, VersionedSyncOperation } from './conflict-core';
import { OfflineSyncQueue } from './offline-sync-queue';
import { RemoteSyncPull } from './remote-sync-pull';

const SNAPSHOT_FORMAT = 'cashx-sync-oplog';
const SNAPSHOT_VERSION = 1;
const SNAPSHOT_KEY_PREFIX = 'oplog:';
const SNAPSHOT_MIME_TYPE = 'application/vnd.cashx.sync+json';
const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
const MAX_DEVICE_ID_BYTES = 80;

const ENTITY_KINDS: ReadonlySet<string> = new Set<SyncEntityKind>([
  'book',
  'record',
  'category',
  'attachment',
  'setting',
]);
const ACTIONS: ReadonlySet<string> = new Set<SyncAction>(['upsert', 'delete', 'restore']);

interface SyncSnapshotV1 {
  format: typeof SNAPSHOT_FORMAT;
  version: typeof SNAPSHOT_VERSION;
  deviceId: string;
  operations: VersionedSyncOperation[];
}

export interface CloudSyncRunResult {
  pushedOperations: number;
  pulledSnapshots: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateDeviceId(deviceId: string): void {
  if (deviceId.trim().length === 0) throw new Error('Sync deviceId cannot be empty.');
  if (/\p{Cc}/u.test(deviceId)) throw new Error('Sync deviceId cannot contain control characters.');
  if (new TextEncoder().encode(deviceId).byteLength > MAX_DEVICE_ID_BYTES) {
    throw new Error(`Sync deviceId exceeds ${MAX_DEVICE_ID_BYTES} UTF-8 bytes.`);
  }
}

function snapshotKey(deviceId: string): string {
  validateDeviceId(deviceId);
  return `${SNAPSHOT_KEY_PREFIX}${deviceId}`;
}

function operationOrder(left: VersionedSyncOperation, right: VersionedSyncOperation): number {
  return left.operationId.localeCompare(right.operationId) || left.deviceId.localeCompare(right.deviceId);
}

function normalizeOperation(value: unknown, expectedDeviceId: string): VersionedSyncOperation {
  if (!isRecord(value)) throw new Error('Sync snapshot contains a non-object operation.');

  const operationId = value.operationId;
  const deviceId = value.deviceId;
  const entityKind = value.entityKind;
  const entityId = value.entityId;
  const baseVersion = value.baseVersion;
  const action = value.action;

  if (typeof operationId !== 'string' || operationId.length === 0) {
    throw new Error('Sync snapshot operationId must be a non-empty string.');
  }
  if (typeof deviceId !== 'string' || deviceId !== expectedDeviceId) {
    throw new Error(`Sync snapshot operation ${operationId} has an unexpected deviceId.`);
  }
  if (typeof entityKind !== 'string' || !ENTITY_KINDS.has(entityKind)) {
    throw new Error(`Sync snapshot operation ${operationId} has an invalid entityKind.`);
  }
  if (typeof entityId !== 'string' || entityId.length === 0) {
    throw new Error(`Sync snapshot operation ${operationId} has an invalid entityId.`);
  }
  if (baseVersion !== null && typeof baseVersion !== 'string') {
    throw new Error(`Sync snapshot operation ${operationId} has an invalid baseVersion.`);
  }
  if (typeof action !== 'string' || !ACTIONS.has(action)) {
    throw new Error(`Sync snapshot operation ${operationId} has an invalid action.`);
  }
  if (!Object.hasOwn(value, 'value')) {
    throw new Error(`Sync snapshot operation ${operationId} is missing value.`);
  }

  return {
    operationId,
    deviceId,
    entityKind: entityKind as SyncEntityKind,
    entityId,
    baseVersion,
    action: action as SyncAction,
    value: value.value,
  };
}

function normalizeSnapshot(value: unknown, expectedKey?: string): SyncSnapshotV1 {
  if (!isRecord(value)) throw new Error('Sync snapshot root must be an object.');
  if (value.format !== SNAPSHOT_FORMAT || value.version !== SNAPSHOT_VERSION) {
    throw new Error('Unsupported Cash-X sync snapshot format.');
  }
  if (typeof value.deviceId !== 'string') throw new Error('Sync snapshot deviceId is invalid.');
  validateDeviceId(value.deviceId);
  if (expectedKey !== undefined && snapshotKey(value.deviceId) !== expectedKey) {
    throw new Error(`Sync snapshot deviceId does not match remote key ${expectedKey}.`);
  }
  if (!Array.isArray(value.operations)) throw new Error('Sync snapshot operations must be an array.');

  const seen = new Set<string>();
  const operations = value.operations.map((item) => {
    const operation = normalizeOperation(item, value.deviceId as string);
    if (seen.has(operation.operationId)) {
      throw new Error(`Sync snapshot contains duplicate operationId ${operation.operationId}.`);
    }
    seen.add(operation.operationId);
    return operation;
  });
  operations.sort(operationOrder);

  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    deviceId: value.deviceId,
    operations,
  };
}

function mergeOperations(
  deviceId: string,
  existing: VersionedSyncOperation[],
  incoming: VersionedSyncOperation[],
): VersionedSyncOperation[] {
  const merged = new Map<string, VersionedSyncOperation>();
  for (const operation of [...existing, ...incoming]) {
    if (operation.deviceId !== deviceId) {
      throw new Error(`Cannot publish operation ${operation.operationId} for another device.`);
    }
    const current = merged.get(operation.operationId);
    if (current !== undefined && JSON.stringify(current) !== JSON.stringify(operation)) {
      throw new Error(`Operation identity collision: ${operation.operationId}`);
    }
    merged.set(operation.operationId, operation);
  }
  return [...merged.values()].sort(operationOrder);
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function digestBytes(bytes: Uint8Array): Promise<string> {
  const copy = Uint8Array.from(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return bytesToHex(new Uint8Array(digest));
}

async function encodeSnapshot(deviceId: string, operations: VersionedSyncOperation[]): Promise<{ blob: Blob; cursor: string }> {
  const snapshot: SyncSnapshotV1 = {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    deviceId,
    operations: [...operations].sort(operationOrder),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) {
    throw new Error(`Sync snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes.`);
  }
  const buffer = Uint8Array.from(bytes).buffer;
  return {
    blob: new Blob([buffer], { type: SNAPSHOT_MIME_TYPE }),
    cursor: await digestBytes(bytes),
  };
}

async function decodeSnapshot(blob: Blob, expectedKey?: string): Promise<{ snapshot: SyncSnapshotV1; cursor: string }> {
  if (blob.size > MAX_SNAPSHOT_BYTES) throw new Error(`Sync snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes.`);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('Sync snapshot contains invalid JSON.');
  }
  return {
    snapshot: normalizeSnapshot(raw, expectedKey),
    cursor: await digestBytes(bytes),
  };
}

export class CloudSyncEngine {
  private readonly ownKey: string;

  constructor(
    private readonly db: CashXDatabase,
    private readonly cloud: CloudSyncProvider,
    private readonly deviceId: string,
  ) {
    this.ownKey = snapshotKey(deviceId);
  }

  async push(limit = 100, signal?: AbortSignal): Promise<number> {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('Sync push limit must be a positive integer.');

    const queue = new OfflineSyncQueue(this.db);
    const pending = await queue.pendingBatch(limit);
    if (pending.length === 0) return 0;

    const existingBlob = await this.cloud.get(this.ownKey, signal);
    const existing = existingBlob === null
      ? []
      : (await decodeSnapshot(existingBlob, this.ownKey)).snapshot.operations;
    const merged = mergeOperations(this.deviceId, existing, pending);
    const encoded = await encodeSnapshot(this.deviceId, merged);

    await this.cloud.put(this.ownKey, encoded.blob, signal);
    await queue.confirm(pending.map((operation) => operation.operationId));
    return pending.length;
  }

  async pull(signal?: AbortSignal): Promise<number> {
    const objects = (await this.cloud.list(signal))
      .filter((item) => item.key.startsWith(SNAPSHOT_KEY_PREFIX) && item.key !== this.ownKey)
      .sort((left, right) => left.key.localeCompare(right.key));
    const pull = new RemoteSyncPull(this.db);

    for (const object of objects) {
      const blob = await this.cloud.get(object.key, signal);
      if (blob === null) throw new Error(`Remote sync snapshot disappeared during pull: ${object.key}`);
      const decoded = await decodeSnapshot(blob, object.key);
      const currentCursor = await pull.cursor(object.key);
      await pull.applyPage({
        remoteId: object.key,
        expectedCursor: currentCursor,
        nextCursor: decoded.cursor,
        operations: decoded.snapshot.operations,
      });
    }

    return objects.length;
  }

  async syncOnce(limit = 100, signal?: AbortSignal): Promise<CloudSyncRunResult> {
    const pushedOperations = await this.push(limit, signal);
    const pulledSnapshots = await this.pull(signal);
    return { pushedOperations, pulledSnapshots };
  }
}
