import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
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
  const { actor } = useWorkspaceActor(options);

  return useUpdate(options.workspaceId, actor.deletePage);
};
