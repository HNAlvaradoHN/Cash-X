import type { IsoTimestamp } from '../domain/persistence-types';
import { LocalPersistence } from '../persistence/local-persistence';
import { decodeCashXBackupFile, encodeCashXBackupFile } from './backup-file';

export class CashXBackupFileService {
  constructor(private readonly persistence: LocalPersistence) {}

  async exportFile(exportedAt: IsoTimestamp): Promise<Blob> {
    const backup = await this.persistence.exportBackup(exportedAt);
    return encodeCashXBackupFile(backup);
  }

  async restoreFile(file: Blob): Promise<void> {
    const backup = await decodeCashXBackupFile(file);
    await this.persistence.restoreBackup(backup);
  }
}
