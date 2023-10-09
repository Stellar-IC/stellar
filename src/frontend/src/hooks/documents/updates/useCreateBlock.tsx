import { Identity } from '@dfinity/agent';
import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { CanisterId } from '@/types';
import { useUpdate } from '../../useUpdate';

export const useCreateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const { actor, canisterId } = useWorkspaceActor(options);
  return useUpdate(canisterId, actor.addBlock);
};
