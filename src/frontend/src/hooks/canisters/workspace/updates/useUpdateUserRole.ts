import { Identity } from '@dfinity/agent';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  UpdateUserRoleUpdateInput,
  UpdateUserRoleUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useUpdateUserRole = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateUserRoleUpdateInput]) => Promise<UpdateUserRoleUpdateOutput>,
  { data: UpdateUserRoleUpdateOutput | null; isLoading: boolean }
] => {
  const { actor } = useWorkspaceContext();

  return useUpdate(options.workspaceId, actor.updateUserRole);
};
