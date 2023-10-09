import { CanisterId } from '@/types';
import { Identity } from '@dfinity/agent';
import { useMemo } from 'react';
import { createActor } from '../../../../../declarations/workspace';

export const useWorkspaceActor = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = options;
  const actor = useMemo(
    () =>
      createActor(workspaceId, {
        agentOptions: {
          identity,
        },
      }),
    [identity]
  );

  return { actor, canisterId: workspaceId };
};
