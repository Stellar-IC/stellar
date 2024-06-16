import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  UpdateBlockInput,
  UpdateBlockOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useUpdateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateBlockInput]) => Promise<UpdateBlockOutput>,
  { data: UpdateBlockOutput | null; isLoading: boolean }
] => {
  const actor = useWorkspaceActor();

  return useUpdate(options.workspaceId, actor.updateBlock);
};
