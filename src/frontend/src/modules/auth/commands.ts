import { db } from '@/db';

import { getAuthClient } from './client';

export async function login(options: { identityProvider: string }) {
  const authClient = await getAuthClient();

  return new Promise<void>((resolve, reject) => {
    authClient.login({
      // 7 days in nanoseconds
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
      identityProvider: options.identityProvider,
      onSuccess: () => {
        resolve();
      },
      onError: (err) => {
        reject(err);
      },
    });
  });
}

export async function logout() {
  const authClient = await getAuthClient();

  await authClient.logout({
    returnTo: 'http://127.0.0.1:5173',
  });

  await db.delete();

  window.location.reload();
}
