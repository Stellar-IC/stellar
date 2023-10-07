import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { v4 as uuidv4, parse as uuidParse } from 'uuid';
import { useDocumentsActor } from '@/hooks/ic/actors/useDocumentsActor';
import {
  CreatePageUpdateInput,
  CreatePageUpdateOutput,
} from '../../../../../declarations/documents/documents.did';
import { useUpdate } from '../../useUpdate';

export const useCreatePage = (
  options: { identity?: Identity } = {}
): [
  (input: Omit<CreatePageUpdateInput, 'uuid'>) => Promise<CreatePageUpdateOutput>,
  { data: CreatePageUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useDocumentsActor(options);
  const [_createPage, ...other] = useUpdate(canisterId, actor.createPage);
  const createPage = useCallback(
    (input: Omit<CreatePageUpdateInput, 'uuid'>) => {
      const uuid = uuidv4();
      return _createPage([{ ...input, uuid: uuidParse(uuid) }]);
    },
    [_createPage]
  );

  return [createPage, ...other];
};
