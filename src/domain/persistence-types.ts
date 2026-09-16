export type IsoTimestamp = string;
export type BusinessDate = string;
export type CurrencyCode = string;
export type EntityId = string;

export interface BookRow {
  id: EntityId;
  name: string;
  currency: CurrencyCode;
  initialBalanceMinor: number;
  status: 'active' | 'archived';
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  deletedAt: IsoTimestamp | null;
}

export interface FinancialRecordRow {
  id: EntityId;
  bookId: EntityId;
  kind: 'income' | 'expense';
  amountMinor: number;
  description: string;
  categoryId: EntityId;
  categoryLabelSnapshot: string;
  businessDate: BusinessDate;
  note: string | null;
  reference: string | null;
  additionalFieldOptionId: EntityId | null;
  additionalFieldLabelSnapshot: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  deletedAt: IsoTimestamp | null;
}

export interface CategoryRow {
  id: EntityId;
  bookId: EntityId;
  name: string;
  active: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  deletedAt: IsoTimestamp | null;
}

export interface AttachmentRow {
  id: EntityId;
  recordId: EntityId;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  blob: Blob;
  createdAt: IsoTimestamp;
  deletedAt: IsoTimestamp | null;
}

export interface MetaRow {
  key: string;
  value: string;
}
