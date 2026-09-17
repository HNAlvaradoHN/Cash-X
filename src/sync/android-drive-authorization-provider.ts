import { registerPlugin } from '@capacitor/core';

import type { CloudAuthorizationProvider } from './contracts';

export interface AndroidDriveAuthorizationPlugin {
  getAccessToken(): Promise<{ accessToken: string }>;
}

let nativePlugin: AndroidDriveAuthorizationPlugin | undefined;

function getNativePlugin(): AndroidDriveAuthorizationPlugin {
  nativePlugin ??= registerPlugin<AndroidDriveAuthorizationPlugin>('CashXGoogleDriveAuthorization');
  return nativePlugin;
}

function abortError(): DOMException {
  return new DOMException('Google Drive authorization was cancelled.', 'AbortError');
}

function awaitWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    return Promise.reject(abortError());
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

export class AndroidDriveAuthorizationProvider implements CloudAuthorizationProvider {
  constructor(private readonly plugin: AndroidDriveAuthorizationPlugin = getNativePlugin()) {}

  async getAccessToken(signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) {
      throw abortError();
    }

    const result = await awaitWithAbort(this.plugin.getAccessToken(), signal);
    const accessToken = result.accessToken.trim();

    if (!accessToken) {
      throw new Error('Google Drive authorization returned an empty access token.');
    }

    return accessToken;
  }
}
