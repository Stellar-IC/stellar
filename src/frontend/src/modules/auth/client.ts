import { AuthClient } from '@dfinity/auth-client';

let authClient: AuthClient;

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
