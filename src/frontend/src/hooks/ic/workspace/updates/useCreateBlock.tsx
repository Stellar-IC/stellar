import { Identity } from '@dfinity/agent';

import { useUpdate } from '@/hooks/useUpdate';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { CanisterId } from '@/types';

export const useCreateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const { actor, canisterId } = useWorkspaceActor(options);
  return useUpdate(canisterId, actor.addBlock);
};
