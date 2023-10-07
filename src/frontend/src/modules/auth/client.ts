import { DelegationIdentity, DelegationChain, Ed25519KeyIdentity } from '@dfinity/identity';

import { AuthClient, IdbStorage } from '@dfinity/auth-client';
import { AnonymousIdentity, Identity, SignIdentity } from '@dfinity/agent';

let authClient: AuthClient;

export async function getIdentity() {
  const storage: IdbStorage = new IdbStorage();

  const identityKey: string | null = await storage.get('identity');
  const delegationChain: string | null = await storage.get('delegation');

  const chain: DelegationChain = DelegationChain.fromJSON(delegationChain!);
  const key: Ed25519KeyIdentity = Ed25519KeyIdentity.fromJSON(identityKey!);

  const identity: DelegationIdentity = DelegationIdentity.fromDelegation(key, chain);
  return identity;
}

export async function getAuthClient() {
  if (authClient) return authClient;

  authClient = await AuthClient.create({
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, // set to 30 minutes
      disableDefaultIdleCallback: true, // disable the default reload behavior
    },
  });

  return authClient;
}

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

  return new Promise<void>((resolve, reject) => {
    authClient.logout({
      returnTo: 'http://127.0.0.1:8080',
    });
  });
}
