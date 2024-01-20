import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';
import {
  DeletePageUpdateInput,
  DeletePageUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useDeletePage = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [DeletePageUpdateInput]) => Promise<DeletePageUpdateOutput>,
  { data: DeletePageUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useWorkspaceActor(options);

  return useUpdate(canisterId, actor.deletePage);
};
