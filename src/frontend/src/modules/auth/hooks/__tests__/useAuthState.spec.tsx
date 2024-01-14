import { act, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { AnonymousIdentity } from '@dfinity/agent';
import { AnonymousUserProfile, useAuthState } from '../useAuthState';
import * as useHydrate from '../useHydrate';
import * as client from '../../client';

vi.mock('@/modules/logger', () => ({
  logger: {
    baseLogger: {},
    getLogger: () => ({
      setDefaultLevel: () => {},
      info: () => {},
    }),
    levels: { INFO: 'INFO' },
  },
}));

describe('useAuthState', () => {
  it('should be initially loading and unauthenticated', async () => {
    const { result } = renderHook(() => useAuthState());

    expect(result.current).toEqual(
      expect.objectContaining({
        isLoading: true,
        isAuthenticated: false,
        userId: expect.anything(),
        identity: expect.anything(),
        login: expect.any(Function),
        profile: expect.objectContaining({
          username: 'Anonymous',
          created_at: 1000000000000000000n,
          updatedAt: 1000000000000000000n,
        }),
      })
    );

    expect(result.current.userId instanceof Principal).toBe(true);
    expect(result.current.userId.toString()).toBe('2vxsx-fae');
    expect(result.current.identity instanceof AnonymousIdentity).toBe(true);
    expect(result.current.identity.getPrincipal().toString()).toBe('2vxsx-fae');
    expect(result.current.profile instanceof AnonymousUserProfile).toBe(true);
  });

  it('should remain in unauthorized state after rehydration attempt if anonymous identity', async () => {
    const mockGetIdentity = vi
      .fn()
      .mockImplementation(async () => new AnonymousIdentity());

    vi.spyOn(client, 'getAuthClient').mockImplementation(async () => {
      const mockClient = {
        getIdentity: mockGetIdentity,
      } as unknown as AuthClient;

      return mockClient;
    });

    const mockHydrate = vi.fn().mockImplementation(async () => ({
      userId: Principal.fromText('2vxsx-fae'),
      identity: new AnonymousIdentity(),
      profile: {
        username: 'Anonymous',
        created_at: 1000000000000000000n,
        updatedAt: 1000000000000000000n,
      },
    }));

    vi.spyOn(useHydrate, 'useHydrate').mockImplementation(() => ({
      hydrate: mockHydrate,
      isLoading: false,
    }));
    vi.useFakeTimers();

    const { result } = renderHook(() => useAuthState());

    // Trigger the useEffect
    act(() => vi.runAllTicks());
    expect(mockHydrate).not.toHaveBeenCalled(); // this is done in a timeout

    // Trigger the timeout
    act(() => vi.advanceTimersByTime(1));
    expect(mockHydrate).toHaveBeenCalled();

    await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should still be in anonymous state
    expect(result.current).toEqual(
      expect.objectContaining({
        isLoading: false,
        isAuthenticated: false,
        userId: expect.anything(),
        identity: expect.anything(),
        login: expect.any(Function),
        profile: expect.objectContaining({
          username: 'Anonymous',
          created_at: 1000000000000000000n,
          updatedAt: 1000000000000000000n,
        }),
      })
    );
    expect(result.current.userId instanceof Principal).toBe(true);
    expect(result.current.userId.toString()).toBe('2vxsx-fae');
    expect(result.current.identity instanceof AnonymousIdentity).toBe(true);
    expect(result.current.identity.getPrincipal().toString()).toBe('2vxsx-fae');
  });

  it.todo(
    'should return the correct state after successful login',
    async () => {}
  );
});
