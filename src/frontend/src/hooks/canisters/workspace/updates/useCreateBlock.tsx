import { Identity } from '@dfinity/agent';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

export const useCreateBlock = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const { actor } = useWorkspaceContext();

  return useUpdate(options.workspaceId, actor.addBlock);
};
