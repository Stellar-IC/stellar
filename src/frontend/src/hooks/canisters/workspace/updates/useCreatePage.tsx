import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { v4 as uuidv4, parse as uuidParse } from 'uuid';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { CanisterId } from '@/types';

import {
  CreatePageUpdateInput,
  CreatePageUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';

export const useCreatePage = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (
    input: Omit<CreatePageUpdateInput, 'uuid'>
  ) => Promise<CreatePageUpdateOutput>,
  { data: CreatePageUpdateOutput | null; isLoading: boolean }
] => {
  const { actor } = useWorkspaceActor(options);
  const [_createPage, ...other] = useUpdate(
    options.workspaceId,
    actor.createPage
  );
  const createPage = useCallback(
    (input: Omit<CreatePageUpdateInput, 'uuid'>) => {
      const uuid = uuidv4();
      const page = { ...input, uuid: uuidParse(uuid) };

      // TODO: Add initial block creation here

      return _createPage([page]);
    },
    [_createPage]
  );

  return [createPage, ...other];
};
