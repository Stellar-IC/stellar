import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { CanisterId } from '@/types';
import {
  SaveEventUpdateInput,
  SaveEventUpdateOutput,
} from '../../../../../declarations/workspace/workspace.did';
import { useUpdate } from '../../useUpdate';

export const useSaveEvent = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (input: SaveEventUpdateInput) => Promise<SaveEventUpdateOutput>,
  { data: SaveEventUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useWorkspaceActor(options);
  const [_saveEvent, ...other] = useUpdate(canisterId, actor.saveEvent);
  const saveEvent = useCallback(
    (input: SaveEventUpdateInput) => _saveEvent([{ ...input }]),
    [_saveEvent]
  );

  return [saveEvent, ...other];
};
