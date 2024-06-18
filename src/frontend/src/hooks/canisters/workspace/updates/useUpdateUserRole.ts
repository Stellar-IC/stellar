import { Identity } from '@dfinity/agent';

import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  UpdateUserRoleInput,
  UpdateUserRoleOutput,
} from '../../../../../../declarations/workspace/workspace.did';
import { useWorkspaceActor } from '../useWorkspaceActor';

export const useUpdateUserRole = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateUserRoleInput]) => Promise<UpdateUserRoleOutput>,
  { data: UpdateUserRoleOutput | null; isLoading: boolean }
] => {
  const actor = useWorkspaceActor();

  return useUpdate(options.workspaceId, actor.updateUserRole);
};
