import type { AttachmentStore } from '../domain/attachment-store';
import type { AttachmentRow, EntityId, IsoTimestamp } from '../domain/persistence-types';
import { CashXDatabase } from './database';

function validateAttachment(attachment: AttachmentRow): void {
  if (!attachment.id.trim()) throw new Error('Attachment id is required.');
  if (!attachment.recordId.trim()) throw new Error('Attachment recordId is required.');
  if (!attachment.fileName.trim()) throw new Error('Attachment fileName is required.');
  if (!attachment.mimeType.trim()) throw new Error('Attachment mimeType is required.');
  if (!Number.isSafeInteger(attachment.sizeBytes) || attachment.sizeBytes < 0) {
    throw new Error('Attachment sizeBytes must be a non-negative safe integer.');
  }
  if (attachment.sizeBytes !== attachment.blob.size) {
    throw new Error('Attachment sizeBytes does not match Blob size.');
  }
  if (attachment.deletedAt !== null) {
    throw new Error('New attachments must not start in Trash.');
  }
}

export class DexieAttachmentStore implements AttachmentStore {
  constructor(private readonly db: CashXDatabase) {}

  async save(attachment: AttachmentRow): Promise<void> {
    await this.saveMany([attachment]);
  }

  async saveMany(attachments: readonly AttachmentRow[]): Promise<void> {
    if (attachments.length === 0) return;
    attachments.forEach(validateAttachment);

    await this.db.transaction('rw', this.db.records, this.db.attachments, async () => {
      const recordIds = [...new Set(attachments.map((attachment) => attachment.recordId))];
      const records = await this.db.records.bulkGet(recordIds);

      for (let index = 0; index < recordIds.length; index += 1) {
        const recordId = recordIds[index];
        const record = records[index];
        if (!record) throw new Error(`Record ${recordId} does not exist.`);
        if (record.deletedAt !== null) {
          throw new Error(`Record ${recordId} is in Trash and cannot receive attachments.`);
        }
      }

      await this.db.attachments.bulkAdd([...attachments]);
    });
  }

  async get(id: EntityId): Promise<AttachmentRow | undefined> {
    return this.db.attachments.get(id);
  }

  async listActive(recordId: EntityId): Promise<AttachmentRow[]> {
    const attachments = await this.db.attachments.where('recordId').equals(recordId).toArray();
    return attachments
      .filter((attachment) => attachment.deletedAt === null)
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
      );
  }

  async moveToTrash(id: EntityId, deletedAt: IsoTimestamp): Promise<void> {
    await this.db.transaction('rw', this.db.attachments, async () => {
      const attachment = await this.db.attachments.get(id);
      if (!attachment) throw new Error(`Attachment ${id} does not exist.`);
      if (attachment.deletedAt !== null) return;
      await this.db.attachments.update(id, { deletedAt });
    });
  }

  async restore(id: EntityId): Promise<void> {
    await this.db.transaction('rw', this.db.records, this.db.attachments, async () => {
      const attachment = await this.db.attachments.get(id);
      if (!attachment) throw new Error(`Attachment ${id} does not exist.`);

      const record = await this.db.records.get(attachment.recordId);
      if (!record) throw new Error(`Record ${attachment.recordId} does not exist.`);
      if (record.deletedAt !== null) {
        throw new Error(`Record ${attachment.recordId} is in Trash and must be restored first.`);
      }

      if (attachment.deletedAt === null) return;
      await this.db.attachments.update(id, { deletedAt: null });
    });
  }

  async deletePermanently(id: EntityId): Promise<void> {
    await this.db.transaction('rw', this.db.attachments, async () => {
      const attachment = await this.db.attachments.get(id);
      if (!attachment) return;
      if (attachment.deletedAt === null) {
        throw new Error('Attachment must be in Trash before permanent deletion.');
      }
      await this.db.attachments.delete(id);
    });
  }

  async purgeDeletedOnOrBefore(cutoff: IsoTimestamp): Promise<number> {
    return this.db.transaction('rw', this.db.attachments, async () => {
      const attachments = await this.db.attachments.toArray();
      const ids = attachments
        .filter(
          (attachment) =>
            attachment.deletedAt !== null && attachment.deletedAt.localeCompare(cutoff) <= 0,
        )
        .map((attachment) => attachment.id);

      if (ids.length > 0) await this.db.attachments.bulkDelete(ids);
      return ids.length;
    });
  }
}
