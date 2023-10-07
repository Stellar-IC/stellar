import { Identity } from '@dfinity/agent';
import { useMemo } from 'react';
import { createActor, canisterId } from '../../../../../declarations/documents';

export const useDocumentsActor = (options: { identity?: Identity } = {}) => {
  const { identity } = options;
  const actor = useMemo(
    () =>
      createActor(canisterId, {
        agentOptions: {
          identity,
        },
      }),
    [identity]
  );

  return { actor, canisterId };
};
