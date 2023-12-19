import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { CanisterId } from '@/types';
import {
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
} from '../../../../../declarations/workspace/workspace.did';
import { useUpdate } from '@/hooks/useUpdate';

export const useSaveEvents = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (
    input: SaveEventTransactionUpdateInput
  ) => Promise<SaveEventTransactionUpdateOutput>,
  { data: SaveEventTransactionUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useWorkspaceActor(options);
  const [_saveEvents, ...other] = useUpdate(canisterId, actor.saveEvents);
  const saveEvents = useCallback(
    (input: SaveEventTransactionUpdateInput) => _saveEvents([{ ...input }]),
    [_saveEvents]
  );

  return [saveEvents, ...other];
};
