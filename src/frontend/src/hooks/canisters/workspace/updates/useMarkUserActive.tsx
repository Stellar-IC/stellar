import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import { UUID } from '../../../../../../declarations/workspace/workspace.did';

export const useMarkUserActive = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [(input: [UUID]) => Promise<void>, { data?: null; isLoading: boolean }] => {
  const { actor } = useWorkspaceActor(options);

  return useUpdate(options.workspaceId, actor.markUserActive);
};
