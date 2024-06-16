import { Identity } from '@dfinity/agent';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  UpdateSettingsInput,
  UpdateSettingsOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useUpdateSettings = (options: {
  workspaceId: CanisterId;
  identity: Identity;
}): [
  (input: [UpdateSettingsInput]) => Promise<UpdateSettingsOutput>,
  { data: UpdateSettingsOutput | null; isLoading: boolean }
] => {
  const actor = useWorkspaceActor();

  return useUpdate(options.workspaceId, actor.updateSettings);
};
