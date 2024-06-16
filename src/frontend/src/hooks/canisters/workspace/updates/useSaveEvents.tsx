import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  SaveEventTransactionInput,
  SaveEventTransactionOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useSaveEvents = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (input: SaveEventTransactionInput) => Promise<SaveEventTransactionOutput>,
  { data: SaveEventTransactionOutput | null; isLoading: boolean }
] => {
  const actor = useWorkspaceActor();
  const [_saveEvents, ...other] = useUpdate(
    options.workspaceId,
    actor.saveEvents
  );
  const saveEvents = useCallback(
    (input: SaveEventTransactionInput) => _saveEvents([{ ...input }]),
    [_saveEvents]
  );

  return [saveEvents, ...other];
};
