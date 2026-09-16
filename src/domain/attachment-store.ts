import type { AttachmentRow, EntityId, IsoTimestamp } from './persistence-types';

export interface AttachmentStore {
  save(attachment: AttachmentRow): Promise<void>;
  saveMany(attachments: readonly AttachmentRow[]): Promise<void>;
  get(id: EntityId): Promise<AttachmentRow | undefined>;
  listActive(recordId: EntityId): Promise<AttachmentRow[]>;
  moveToTrash(id: EntityId, deletedAt: IsoTimestamp): Promise<void>;
  restore(id: EntityId): Promise<void>;
  deletePermanently(id: EntityId): Promise<void>;
  purgeDeletedOnOrBefore(cutoff: IsoTimestamp): Promise<number>;
}
