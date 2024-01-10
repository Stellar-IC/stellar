import { AuthClient } from '@dfinity/auth-client';
import { describe, vi } from 'vitest';
import { getAuthClient } from '../client';

describe('client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getAuthClient', () => {
    it('should return and cache auth client', async () => {
      const mockAuthClientCreate = vi
        .spyOn(AuthClient, 'create')
        // @ts-ignore
        .mockImplementation(() => 'fakeAuthClient');

      const authClient = await getAuthClient();

      expect(mockAuthClientCreate).toHaveBeenCalledWith({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30,
          disableDefaultIdleCallback: true,
        },
      });
      expect(authClient).toEqual('fakeAuthClient');

      // Reset the mock so that we can test that the auth client is cached
      mockAuthClientCreate.mockReset();

      const otherAuthClient = await getAuthClient();

      expect(mockAuthClientCreate).toHaveBeenCalledTimes(0);
      expect(otherAuthClient).toEqual('fakeAuthClient');
    });
  });
});
