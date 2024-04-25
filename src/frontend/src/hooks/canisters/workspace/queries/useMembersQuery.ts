import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { CanisterId } from '@/types';

import { MembersOutput } from '../../../../../../declarations/workspace/workspace.did';

export const useMembersQuery = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}): (() => Promise<MembersOutput>) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const query = useCallback(async () => {
    const result = await actor.members();

    return result;
  }, [actor]);

  return query;
};
