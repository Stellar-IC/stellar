import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { useDocumentsActor } from '@/hooks/ic/actors/useDocumentsActor';
import {
  SaveEventUpdateInput,
  SaveEventUpdateOutput,
} from '../../../../../declarations/documents/documents.did';
import { useUpdate } from '../../useUpdate';

export const useSaveEvent = (
  options: { identity?: Identity } = {}
): [
  (input: SaveEventUpdateInput) => Promise<SaveEventUpdateOutput>,
  { data: SaveEventUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useDocumentsActor(options);
  const [_saveEvent, ...other] = useUpdate(canisterId, actor.saveEvent);
  const saveEvent = useCallback(
    (input: SaveEventUpdateInput) => _saveEvent([{ ...input }]),
    [_saveEvent]
  );

  return [saveEvent, ...other];
};
