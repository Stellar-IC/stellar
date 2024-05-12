import { Identity } from '@dfinity/agent';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  UpdateBlockUpdateInput,
  UpdateBlockUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useUpdateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateBlockUpdateInput]) => Promise<UpdateBlockUpdateOutput>,
  { data: UpdateBlockUpdateOutput | null; isLoading: boolean }
] => {
  const { actor } = useWorkspaceContext();

  return useUpdate(options.workspaceId, actor.updateBlock);
};
