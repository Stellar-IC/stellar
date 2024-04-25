import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  UpdateSettingsUpdateInput,
  UpdateSettingsUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useUpdateSettings = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateSettingsUpdateInput]) => Promise<UpdateSettingsUpdateOutput>,
  { data: UpdateSettingsUpdateOutput | null; isLoading: boolean }
] => {
  const { actor } = useWorkspaceActor(options);

  return useUpdate(options.workspaceId, actor.updateSettings);
};
