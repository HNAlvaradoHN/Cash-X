import { describe, expect, it, vi } from 'vitest';

import {
  AndroidDriveAuthorizationProvider,
  type AndroidDriveAuthorizationPlugin,
} from '../src/sync/android-drive-authorization-provider';

describe('AndroidDriveAuthorizationProvider', () => {
  it('returns a trimmed access token from the native bridge', async () => {
    const plugin: AndroidDriveAuthorizationPlugin = {
      getAccessToken: vi.fn(async () => ({ accessToken: '  token-123  ' })),
    };
    const provider = new AndroidDriveAuthorizationProvider(plugin);

    await expect(provider.getAccessToken()).resolves.toBe('token-123');
    expect(plugin.getAccessToken).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty token instead of sending an invalid credential to Drive', async () => {
    const plugin: AndroidDriveAuthorizationPlugin = {
      getAccessToken: vi.fn(async () => ({ accessToken: '   ' })),
    };
    const provider = new AndroidDriveAuthorizationProvider(plugin);

    await expect(provider.getAccessToken()).rejects.toThrow('empty access token');
  });

  it('does not start native authorization when the request is already aborted', async () => {
    const plugin: AndroidDriveAuthorizationPlugin = {
      getAccessToken: vi.fn(async () => ({ accessToken: 'unused' })),
    };
    const provider = new AndroidDriveAuthorizationProvider(plugin);
    const controller = new AbortController();
    controller.abort();

    await expect(provider.getAccessToken(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(plugin.getAccessToken).not.toHaveBeenCalled();
  });

  it('stops waiting when the caller aborts an authorization already in progress', async () => {
    let resolveNative!: (value: { accessToken: string }) => void;
    const nativeResult = new Promise<{ accessToken: string }>((resolve) => {
      resolveNative = resolve;
    });
    const plugin: AndroidDriveAuthorizationPlugin = {
      getAccessToken: vi.fn(() => nativeResult),
    };
    const provider = new AndroidDriveAuthorizationProvider(plugin);
    const controller = new AbortController();

    const result = provider.getAccessToken(controller.signal);
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    resolveNative({ accessToken: 'late-token' });
  });

  it('preserves native authorization failures for the caller to handle', async () => {
    const nativeError = Object.assign(new Error('User cancelled'), { code: 'AUTHORIZATION_CANCELLED' });
    const plugin: AndroidDriveAuthorizationPlugin = {
      getAccessToken: vi.fn(async () => Promise.reject(nativeError)),
    };
    const provider = new AndroidDriveAuthorizationProvider(plugin);

    await expect(provider.getAccessToken()).rejects.toBe(nativeError);
  });
});
