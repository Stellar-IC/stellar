import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useSaveEvents = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (
    input: SaveEventTransactionUpdateInput
  ) => Promise<SaveEventTransactionUpdateOutput>,
  { data: SaveEventTransactionUpdateOutput | null; isLoading: boolean }
] => {
  const { actor } = useWorkspaceContext();
  const [_saveEvents, ...other] = useUpdate(
    options.workspaceId,
    actor.saveEvents
  );
  const saveEvents = useCallback(
    (input: SaveEventTransactionUpdateInput) => _saveEvents([{ ...input }]),
    [_saveEvents]
  );

  return [saveEvents, ...other];
};
