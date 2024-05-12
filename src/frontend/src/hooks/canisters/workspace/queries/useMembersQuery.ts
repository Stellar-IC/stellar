import { useCallback } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';

import { MembersOutput } from '../../../../../../declarations/workspace/workspace.did';

export const useMembersQuery = (): (() => Promise<MembersOutput>) => {
  const { actor } = useWorkspaceContext();

  const query = useCallback(async () => {
    const result = await actor.members();

    return result;
  }, [actor]);

  return query;
};
