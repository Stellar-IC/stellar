import { useCallback } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';

import { SettingsOutput } from '../../../../../../declarations/workspace/workspace.did';

export const useSettingsQuery = (): (() => Promise<SettingsOutput>) => {
  const { actor } = useWorkspaceContext();

  const query = useCallback(async () => {
    const result = await actor.settings();

    return result;
  }, [actor]);

  return query;
};
