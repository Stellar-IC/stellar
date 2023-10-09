import { Identity } from '@dfinity/agent';
import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { CanisterId } from '@/types';
import {
  UpdateBlockUpdateInput,
  UpdateBlockUpdateOutput,
} from '../../../../../declarations/workspace/workspace.did';
import { useUpdate } from '../../useUpdate';

export const useUpdateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateBlockUpdateInput]) => Promise<UpdateBlockUpdateOutput>,
  { data: UpdateBlockUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useWorkspaceActor(options);

  return useUpdate(canisterId, actor.updateBlock);
};
