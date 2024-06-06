import { useCallback } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';

import { MembersOutput } from '../../../../../../declarations/workspace/workspace.did';

export const useMembersQuery = (): (() => Promise<MembersOutput>) => {
  const actor = useWorkspaceActor();

  const query = useCallback(async () => {
    const result = await actor.members();

    return result;
  }, [actor]);

  return query;
};
