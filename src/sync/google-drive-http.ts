import type { CloudAuthorizationProvider } from './contracts';

export const GOOGLE_DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const GOOGLE_DRIVE_REQUIRED_SCOPES = [
  GOOGLE_DRIVE_APPDATA_SCOPE,
  GOOGLE_DRIVE_FILE_SCOPE,
] as const;

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILE_FIELDS =
  'id,name,mimeType,size,createdTime,modifiedTime,parents,appProperties';
const RETRYABLE_403_REASONS = new Set(['rateLimitExceeded', 'userRateLimitExceeded']);

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type SleepLike = (milliseconds: number, signal?: AbortSignal) => Promise<void>;

export interface GoogleDriveHttpClientOptions {
  authorization: CloudAuthorizationProvider;
  fetchFn?: FetchLike;
  sleepFn?: SleepLike;
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  appProperties?: Record<string, string>;
}

export interface DriveFileMetadataInput {
  name: string;
  mimeType?: string;
  parents?: string[];
  appProperties?: Record<string, string>;
}

interface DriveFileListResponse {
  files?: DriveFile[];
  nextPageToken?: string;
}

interface DriveErrorPayload {
  error?: {
    message?: string;
    errors?: Array<{
      reason?: string;
    }>;
  };
}

interface LinkedSignal {
  signal: AbortSignal;
  cleanup(): void;
  wasTimedOut(): boolean;
}

export class GoogleDriveApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason: string | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'GoogleDriveApiError';
  }
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function defaultSleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : abortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);

    const onAbort = (): void => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(signal?.reason instanceof Error ? signal.reason : abortError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function escapeDriveQueryLiteral(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

export function driveQueryEquals(field: string, value: string): string {
  return `${field} = '${escapeDriveQueryLiteral(value)}'`;
}

export function driveQueryAppProperty(key: string, value: string): string {
  return `appProperties has { key='${escapeDriveQueryLiteral(key)}' and value='${escapeDriveQueryLiteral(value)}' }`;
}

export function parseDriveSize(size: string | undefined): number | null {
  if (size === undefined) return null;
  const parsed = Number(size);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export class GoogleDriveHttpClient {
  private readonly authorization: CloudAuthorizationProvider;
  private readonly fetchFn: FetchLike;
  private readonly sleepFn: SleepLike;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: GoogleDriveHttpClientOptions) {
    this.authorization = options.authorization;
    this.fetchFn = options.fetchFn ?? fetch.bind(globalThis);
    this.sleepFn = options.sleepFn ?? defaultSleep;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.maxAttempts = options.maxAttempts ?? 4;
    this.baseDelayMs = options.baseDelayMs ?? 250;
    this.maxDelayMs = options.maxDelayMs ?? 4_000;

    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error('Google Drive timeout must be a positive integer.');
    }
    if (!Number.isSafeInteger(this.maxAttempts) || this.maxAttempts < 1 || this.maxAttempts > 8) {
      throw new Error('Google Drive maxAttempts must be between 1 and 8.');
    }
  }

  async listFiles(options: {
    q?: string;
    spaces?: 'appDataFolder' | 'drive';
    signal?: AbortSignal;
  }): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(DRIVE_FILES_URL);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('fields', `nextPageToken,files(${DRIVE_FILE_FIELDS})`);
      if (options.q !== undefined) url.searchParams.set('q', options.q);
      if (options.spaces !== undefined) url.searchParams.set('spaces', options.spaces);
      if (pageToken !== undefined) url.searchParams.set('pageToken', pageToken);

      const response = await this.requestJson<DriveFileListResponse>(url, { method: 'GET' }, options.signal);
      if (response.files !== undefined) files.push(...response.files);
      pageToken = response.nextPageToken;
    } while (pageToken !== undefined && pageToken.length > 0);

    return files;
  }

  async createMetadataFile(
    metadata: DriveFileMetadataInput,
    signal?: AbortSignal,
  ): Promise<DriveFile> {
    const url = new URL(DRIVE_FILES_URL);
    url.searchParams.set('fields', DRIVE_FILE_FIELDS);
    return this.requestJson<DriveFile>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(metadata),
      },
      signal,
    );
  }

  async createMultipartFile(
    metadata: DriveFileMetadataInput,
    payload: Blob,
    signal?: AbortSignal,
  ): Promise<DriveFile> {
    const url = new URL(DRIVE_UPLOAD_URL);
    url.searchParams.set('uploadType', 'multipart');
    url.searchParams.set('fields', DRIVE_FILE_FIELDS);
    const body = this.createMultipartBody(metadata, payload);
    return this.requestJson<DriveFile>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': body.type },
        body,
      },
      signal,
    );
  }

  async updateMultipartFile(
    fileId: string,
    metadata: DriveFileMetadataInput,
    payload: Blob,
    signal?: AbortSignal,
  ): Promise<DriveFile> {
    const url = new URL(`${DRIVE_UPLOAD_URL}/${encodeURIComponent(fileId)}`);
    url.searchParams.set('uploadType', 'multipart');
    url.searchParams.set('fields', DRIVE_FILE_FIELDS);
    const body = this.createMultipartBody(metadata, payload);
    return this.requestJson<DriveFile>(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': body.type },
        body,
      },
      signal,
    );
  }

  async updateMedia(fileId: string, payload: Blob, signal?: AbortSignal): Promise<DriveFile> {
    const url = new URL(`${DRIVE_UPLOAD_URL}/${encodeURIComponent(fileId)}`);
    url.searchParams.set('uploadType', 'media');
    url.searchParams.set('fields', DRIVE_FILE_FIELDS);
    return this.requestJson<DriveFile>(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': payload.type || 'application/octet-stream' },
        body: payload,
      },
      signal,
    );
  }

  async downloadFile(fileId: string, signal?: AbortSignal): Promise<Blob> {
    const url = new URL(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`);
    url.searchParams.set('alt', 'media');
    const response = await this.request(url, { method: 'GET' }, signal);
    return response.blob();
  }

  private createMultipartBody(metadata: DriveFileMetadataInput, payload: Blob): Blob {
    const boundary = `cashx-${Math.random().toString(16).slice(2)}`;
    const prefix =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${payload.type || 'application/octet-stream'}\r\n\r\n`;
    const suffix = `\r\n--${boundary}--`;
    return new Blob([prefix, payload, suffix], {
      type: `multipart/related; boundary=${boundary}`,
    });
  }

  private async requestJson<T>(url: URL, init: RequestInit, signal?: AbortSignal): Promise<T> {
    const response = await this.request(url, init, signal);
    return (await response.json()) as T;
  }

  private async request(url: URL, init: RequestInit, signal?: AbortSignal): Promise<Response> {
    let lastError: GoogleDriveApiError | null = null;

    for (let attempt = 0; attempt < this.maxAttempts; attempt += 1) {
      if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : abortError();

      const token = await this.authorization.getAccessToken(signal);
      if (token.trim().length === 0) throw new Error('Google Drive access token is empty.');

      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Accept', 'application/json');
      const linked = this.createLinkedSignal(signal);

      try {
        const response = await this.fetchFn(url, { ...init, headers, signal: linked.signal });
        if (response.ok) return response;

        const apiError = await this.toApiError(response);
        lastError = apiError;
        if (!apiError.retryable || attempt + 1 >= this.maxAttempts) throw apiError;
        await this.sleepFn(this.retryDelay(attempt, response.headers.get('Retry-After')), signal);
      } catch (error) {
        if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : abortError();

        const apiError =
          error instanceof GoogleDriveApiError
            ? error
            : new GoogleDriveApiError(
                linked.wasTimedOut() ? 'Google Drive request timed out.' : 'Google Drive network request failed.',
                0,
                linked.wasTimedOut() ? 'timeout' : 'networkError',
                true,
              );
        lastError = apiError;

        if (!apiError.retryable || attempt + 1 >= this.maxAttempts) throw apiError;
        await this.sleepFn(this.retryDelay(attempt, null), signal);
      } finally {
        linked.cleanup();
      }
    }

    throw lastError ?? new GoogleDriveApiError('Google Drive request failed.', 0, null, false);
  }

  private createLinkedSignal(externalSignal?: AbortSignal): LinkedSignal {
    const controller = new AbortController();
    let timedOut = false;

    const onExternalAbort = (): void => {
      controller.abort(externalSignal?.reason);
    };

    if (externalSignal?.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(abortError());
    }, this.timeoutMs);

    return {
      signal: controller.signal,
      wasTimedOut: () => timedOut,
      cleanup: () => {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onExternalAbort);
      },
    };
  }

  private async toApiError(response: Response): Promise<GoogleDriveApiError> {
    let payload: DriveErrorPayload | null = null;
    try {
      payload = (await response.clone().json()) as DriveErrorPayload;
    } catch {
      payload = null;
    }

    const reason = payload?.error?.errors?.[0]?.reason ?? null;
    const message = payload?.error?.message ?? `Google Drive request failed with HTTP ${response.status}.`;
    const retryable =
      response.status === 408 ||
      response.status === 429 ||
      response.status >= 500 ||
      (response.status === 403 && reason !== null && RETRYABLE_403_REASONS.has(reason));

    return new GoogleDriveApiError(message, response.status, reason, retryable);
  }

  private retryDelay(attempt: number, retryAfter: string | null): number {
    const retryAfterDelay = this.parseRetryAfter(retryAfter);
    if (retryAfterDelay !== null) return Math.min(retryAfterDelay, this.maxDelayMs);
    return Math.min(this.baseDelayMs * 2 ** attempt, this.maxDelayMs);
  }

  private parseRetryAfter(value: string | null): number | null {
    if (value === null) return null;

    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1_000);

    const date = Date.parse(value);
    if (Number.isNaN(date)) return null;
    return Math.max(0, date - Date.now());
  }
}
