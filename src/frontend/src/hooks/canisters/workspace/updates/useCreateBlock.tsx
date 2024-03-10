import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

export const useCreateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const { actor } = useWorkspaceActor(options);

  return useUpdate(options.workspaceId, actor.addBlock);
};
