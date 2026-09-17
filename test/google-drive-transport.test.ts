import { describe, expect, it } from 'vitest';
import type { CloudAuthorizationProvider } from '../src/sync/contracts';
import { GoogleDriveCloudSyncProvider } from '../src/sync/google-drive-cloud-sync-provider';
import { GoogleDriveHttpClient } from '../src/sync/google-drive-http';
import { GoogleDriveVisibleFileStore } from '../src/sync/google-drive-visible-store';

interface RecordedRequest {
  url: string;
  method: string;
  headers: Headers;
  body: BodyInit | null;
}

const authorization: CloudAuthorizationProvider = {
  async getAccessToken(): Promise<string> {
    return 'test-access-token';
  },
};

function recordRequest(input: RequestInfo | URL, init?: RequestInit): RecordedRequest {
  const url =
    input instanceof Request ? input.url : input instanceof URL ? input.toString() : input;
  return {
    url,
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers),
    body: init?.body ?? null,
  };
}

function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
}

function driveFile(
  id: string,
  name: string,
  mimeType: string,
  appProperties: Record<string, string>,
  parents: string[],
): Record<string, unknown> {
  return {
    id,
    name,
    mimeType,
    size: mimeType === 'application/vnd.google-apps.folder' ? undefined : '4',
    createdTime: '2026-09-17T00:00:00.000Z',
    modifiedTime: '2026-09-17T00:00:00.000Z',
    parents,
    appProperties,
  };
}

async function blobBodyText(body: BodyInit | null): Promise<string> {
  if (!(body instanceof Blob)) throw new Error('Expected request body to be a Blob.');
  return body.text();
}

describe('Google Drive transport', () => {
  it('creates internal sync data only inside appDataFolder', async () => {
    const requests: RecordedRequest[] = [];
    const fetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = recordRequest(input, init);
      requests.push(request);

      if (requests.length === 1) return jsonResponse({ files: [] });
      if (requests.length === 2) {
        return jsonResponse(
          driveFile(
            'remote-sync-1',
            'cashx-sync-ledger-current.cashx',
            'application/vnd.cash-x.backup',
            { cashxKind: 'sync', cashxKey: 'ledger-current', cashxFormat: '1' },
            ['appDataFolder'],
          ),
        );
      }
      throw new Error('Unexpected request.');
    };

    const client = new GoogleDriveHttpClient({ authorization, fetchFn, maxAttempts: 1 });
    const provider = new GoogleDriveCloudSyncProvider(client);
    const result = await provider.put(
      'ledger-current',
      new Blob([new Uint8Array([1, 2, 3, 4]).buffer], {
        type: 'application/vnd.cash-x.backup',
      }),
    );

    expect(result).toMatchObject({ key: 'ledger-current', remoteId: 'remote-sync-1' });
    expect(requests).toHaveLength(2);

    const lookupUrl = new URL(requests[0]!.url);
    expect(lookupUrl.searchParams.get('spaces')).toBe('appDataFolder');
    expect(lookupUrl.searchParams.get('q')).toContain("cashxKind");
    expect(lookupUrl.searchParams.get('q')).toContain("ledger-current");

    const upload = requests[1]!;
    expect(upload.method).toBe('POST');
    expect(new URL(upload.url).searchParams.get('uploadType')).toBe('multipart');
    expect(upload.headers.get('Authorization')).toBe('Bearer test-access-token');
    const multipart = await blobBodyText(upload.body);
    expect(multipart).toContain('"parents":["appDataFolder"]');
    expect(multipart).not.toContain('"parents":["root"]');
  });

  it('updates an existing sync object instead of creating a duplicate and can read it back', async () => {
    const requests: RecordedRequest[] = [];
    const existing = driveFile(
      'remote-sync-1',
      'cashx-sync-ledger-current.cashx',
      'application/vnd.cash-x.backup',
      { cashxKind: 'sync', cashxKey: 'ledger-current', cashxFormat: '1' },
      ['appDataFolder'],
    );

    const fetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = recordRequest(input, init);
      requests.push(request);
      switch (requests.length) {
        case 1:
        case 3:
          return jsonResponse({ files: [existing] });
        case 2:
          return jsonResponse({ ...existing, modifiedTime: '2026-09-17T01:00:00.000Z' });
        case 4:
          return new Response(new Uint8Array([9, 8, 7]).buffer, {
            status: 200,
            headers: { 'Content-Type': 'application/vnd.cash-x.backup' },
          });
        default:
          throw new Error('Unexpected request.');
      }
    };

    const provider = new GoogleDriveCloudSyncProvider(
      new GoogleDriveHttpClient({ authorization, fetchFn, maxAttempts: 1 }),
    );

    await provider.put('ledger-current', new Blob(['updated']));
    const downloaded = await provider.get('ledger-current');

    expect(requests[1]!.method).toBe('PATCH');
    expect(new URL(requests[1]!.url).pathname).toContain('/remote-sync-1');
    expect(new URL(requests[1]!.url).searchParams.get('uploadType')).toBe('media');
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(0);
    expect(downloaded).not.toBeNull();
    expect([...new Uint8Array(await downloaded!.arrayBuffer())]).toEqual([9, 8, 7]);
  });

  it('retries bounded rate-limit responses before succeeding', async () => {
    const requests: RecordedRequest[] = [];
    const delays: number[] = [];
    const fetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      requests.push(recordRequest(input, init));
      if (requests.length === 1) {
        return jsonResponse(
          { error: { message: 'Too many requests', errors: [{ reason: 'rateLimitExceeded' }] } },
          429,
          { 'Retry-After': '0' },
        );
      }
      return jsonResponse({ files: [] });
    };

    const client = new GoogleDriveHttpClient({
      authorization,
      fetchFn,
      maxAttempts: 3,
      sleepFn: async (milliseconds): Promise<void> => {
        delays.push(milliseconds);
      },
    });

    await expect(client.listFiles({ spaces: 'appDataFolder' })).resolves.toEqual([]);
    expect(requests).toHaveLength(2);
    expect(delays).toEqual([0]);
  });

  it('keeps visible files under one managed Cash-X root and reuses that hierarchy', async () => {
    const requests: RecordedRequest[] = [];
    const folderMime = 'application/vnd.google-apps.folder';
    const root = driveFile('root-cashx', 'Cash-X', folderMime, { cashxRole: 'root', cashxFormat: '1' }, ['root']);
    const backups = driveFile(
      'folder-backups',
      'Backups',
      folderMime,
      { cashxRole: 'backups', cashxFormat: '1' },
      ['root-cashx'],
    );
    const backup = driveFile(
      'backup-1',
      'cash-x-2026-09-16.cashx',
      'application/vnd.cash-x.backup',
      { cashxRole: 'visible-object', cashxObjectKey: 'backup-current', cashxFormat: '1' },
      ['folder-backups'],
    );

    const fetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = recordRequest(input, init);
      requests.push(request);
      switch (requests.length) {
        case 1:
          return jsonResponse({ files: [] });
        case 2:
          return jsonResponse(root);
        case 3:
          return jsonResponse({ files: [] });
        case 4:
          return jsonResponse(backups);
        case 5:
          return jsonResponse({ files: [] });
        case 6:
          return jsonResponse(backup);
        case 7:
          return jsonResponse({ files: [root] });
        case 8:
          return jsonResponse({ files: [backups] });
        case 9:
          return jsonResponse({ files: [backup] });
        case 10:
          return jsonResponse({ ...backup, modifiedTime: '2026-09-17T02:00:00.000Z' });
        default:
          throw new Error('Unexpected request.');
      }
    };

    const store = new GoogleDriveVisibleFileStore(
      new GoogleDriveHttpClient({ authorization, fetchFn, maxAttempts: 1 }),
    );
    const payload = new Blob(['cash-x'], { type: 'application/vnd.cash-x.backup' });

    await store.put('Backups', 'backup-current', 'cash-x-2026-09-16.cashx', payload);
    await store.put('Backups', 'backup-current', 'cash-x-2026-09-16.cashx', payload);

    expect(requests).toHaveLength(10);

    const rootCreate = requests[1]!;
    expect(rootCreate.method).toBe('POST');
    expect(rootCreate.url).toContain('/drive/v3/files');
    expect(rootCreate.body).toBeTypeOf('string');
    expect(JSON.parse(rootCreate.body as string)).toMatchObject({
      name: 'Cash-X',
      parents: ['root'],
      appProperties: { cashxRole: 'root' },
    });

    const backupFolderCreate = requests[3]!;
    expect(JSON.parse(backupFolderCreate.body as string)).toMatchObject({
      name: 'Backups',
      parents: ['root-cashx'],
      appProperties: { cashxRole: 'backups' },
    });

    const visibleFileCreate = requests[5]!;
    const createMultipart = await blobBodyText(visibleFileCreate.body);
    expect(createMultipart).toContain('"parents":["folder-backups"]');
    expect(createMultipart).not.toContain('"parents":["root"]');

    expect(requests[9]!.method).toBe('PATCH');
    expect(requests[9]!.url).toContain('/backup-1');

    const metadataFolderPosts = requests.filter(
      (request) =>
        request.method === 'POST' &&
        new URL(request.url).hostname === 'www.googleapis.com' &&
        !new URL(request.url).pathname.startsWith('/upload/'),
    );
    expect(metadataFolderPosts).toHaveLength(2);
  });

  it('refuses ambiguous duplicate sync keys instead of overwriting silently', async () => {
    const duplicate = driveFile(
      'duplicate-1',
      'sync.cashx',
      'application/vnd.cash-x.backup',
      { cashxKind: 'sync', cashxKey: 'same-key', cashxFormat: '1' },
      ['appDataFolder'],
    );
    const fetchFn = async (): Promise<Response> =>
      jsonResponse({ files: [duplicate, { ...duplicate, id: 'duplicate-2' }] });

    const provider = new GoogleDriveCloudSyncProvider(
      new GoogleDriveHttpClient({ authorization, fetchFn, maxAttempts: 1 }),
    );

    await expect(provider.put('same-key', new Blob(['x']))).rejects.toThrow(
      'multiple Cash-X sync objects',
    );
  });
});
