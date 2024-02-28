import { AuthClient } from '@dfinity/auth-client';
import { describe, vi } from 'vitest';

import * as client from '../client';
import { login, logout } from '../commands';

describe('client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('should login', async () => {
      const mockAuthClientLogin = vi.fn().mockImplementation((opts) => {
        opts.onSuccess();
      });

      vi.spyOn(client, 'getAuthClient').mockImplementation(async () => {
        const mockClient = {
          login: mockAuthClientLogin,
        } as unknown as AuthClient;

        return mockClient;
      });

      await login({ identityProvider: 'identityProvider' });

      expect(mockAuthClientLogin).toHaveBeenCalledWith({
        // 7 days in nanoseconds
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
        identityProvider: 'identityProvider',
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should reject on failed login', () => {
      const mockAuthClientLogin = vi
        .fn()
        // @ts-ignore
        .mockImplementation(() => {
          throw new Error('error');
        });

      vi.spyOn(client, 'getAuthClient').mockImplementation(async () => {
        const mockClient = {
          login: mockAuthClientLogin,
        } as unknown as AuthClient;

        return mockClient;
      });

      expect(login({ identityProvider: 'identityProvider' })).rejects.toThrow(
        'error'
      );
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      const mockAuthClientLogout = vi.fn().mockImplementation(() => {});

      vi.spyOn(client, 'getAuthClient').mockImplementation(async () => {
        const mockClient = {
          logout: mockAuthClientLogout,
        } as unknown as AuthClient;

        return mockClient;
      });

      await logout();

      expect(mockAuthClientLogout).toHaveBeenCalledWith({
        returnTo: 'http://127.0.0.1:8080',
      });
    });
  });
});
