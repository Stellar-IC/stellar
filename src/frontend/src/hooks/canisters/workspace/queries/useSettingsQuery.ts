import { useCallback } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';

import { SettingsOutput } from '../../../../../../declarations/workspace/workspace.did';

export const useSettingsQuery = (): (() => Promise<SettingsOutput>) => {
  const actor = useWorkspaceActor();

  const query = useCallback(async () => {
    const result = await actor.settings();

    return result;
  }, [actor]);

  return query;
};
