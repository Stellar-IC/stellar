import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { CanisterId } from '@/types';

import { SettingsOutput } from '../../../../../../declarations/workspace/workspace.did';

export const useSettingsQuery = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}): (() => Promise<SettingsOutput>) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const query = useCallback(async () => {
    const result = await actor.settings();

    return result;
  }, [actor]);

  return query;
};
