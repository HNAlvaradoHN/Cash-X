import { AndroidDriveAuthorizationProvider } from '../../src/sync/android-drive-authorization-provider';
import { GoogleDriveCloudSyncProvider } from '../../src/sync/google-drive-cloud-sync-provider';
import { GoogleDriveHttpClient } from '../../src/sync/google-drive-http';

const PROBE_KEY = 'diagnostic:android-real-drive';
const FIRST_PAYLOAD = 'cash-x-drive-probe-v1';
const SECOND_PAYLOAD = 'cash-x-drive-probe-v2';

function publish(status: string): void {
  console.info(status);

  const root = document.querySelector<HTMLElement>('#app');
  if (root) {
    root.textContent = status;
    return;
  }

  document.body.textContent = status;
}

async function readText(blob: Blob | null): Promise<string> {
  if (!blob) {
    throw new Error('Google Drive did not return the Cash-X diagnostic object.');
  }
  return blob.text();
}

async function runProbe(): Promise<void> {
  publish('CASHX_DRIVE_PROBE_START');

  const authorization = new AndroidDriveAuthorizationProvider();
  const drive = new GoogleDriveHttpClient({ authorization });
  const provider = new GoogleDriveCloudSyncProvider(drive);

  const created = await provider.put(
    PROBE_KEY,
    new Blob([FIRST_PAYLOAD], { type: 'text/plain;charset=utf-8' }),
  );

  const firstRead = await readText(await provider.get(PROBE_KEY));
  if (firstRead !== FIRST_PAYLOAD) {
    throw new Error('Cash-X Drive diagnostic create/read integrity check failed.');
  }

  const updated = await provider.put(
    PROBE_KEY,
    new Blob([SECOND_PAYLOAD], { type: 'text/plain;charset=utf-8' }),
  );

  if (updated.remoteId !== created.remoteId) {
    throw new Error('Cash-X Drive diagnostic update created a duplicate remote object.');
  }

  const secondRead = await readText(await provider.get(PROBE_KEY));
  if (secondRead !== SECOND_PAYLOAD) {
    throw new Error('Cash-X Drive diagnostic update/read integrity check failed.');
  }

  const matches = (await provider.list()).filter((item) => item.key === PROBE_KEY);
  if (matches.length !== 1 || matches[0]?.remoteId !== created.remoteId) {
    throw new Error('Cash-X Drive diagnostic object identity is ambiguous after update.');
  }

  publish('CASHX_DRIVE_PROBE_OK');
}

void runProbe().catch((error: unknown) => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : null;
  const message = error instanceof Error ? error.message : String(error);
  publish(`CASHX_DRIVE_PROBE_ERROR:${code ?? message}`);
});
