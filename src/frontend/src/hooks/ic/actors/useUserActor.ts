import { Identity } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { useMemo } from 'react';
import { createActor } from '../../../../../declarations/user';

export const useUserActor = (options: {
  identity: Identity;
  userId: Principal;
}) => {
  const { identity, userId } = options;
  const actor = useMemo(
    () =>
      createActor(userId, {
        agentOptions: {
          identity,
        },
      }),
    [identity]
  );

  return { actor, canisterId: userId };
};
