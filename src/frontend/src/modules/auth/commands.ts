import { db } from '@/db';
import { agentManager } from '@/ic/agentManager';

export async function login(options: { identityProvider: string }) {
  return new Promise<void>((resolve, reject) => {
    agentManager.login({
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
  await agentManager.logout({
    returnTo: window.location.host,
  });

  await db.delete();

  window.location.reload();
}
