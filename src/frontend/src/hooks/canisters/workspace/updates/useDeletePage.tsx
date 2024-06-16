import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  DeletePageInput,
  DeletePageOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useDeletePage = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [DeletePageInput]) => Promise<DeletePageOutput>,
  { data: DeletePageOutput | null; isLoading: boolean }
] => {
  const actor = useWorkspaceActor();

  return useUpdate(options.workspaceId, actor.deletePage);
};
