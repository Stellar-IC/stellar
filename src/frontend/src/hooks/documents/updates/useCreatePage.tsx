import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { v4 as uuidv4, parse as uuidParse } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import * as blockSerializers from '@/modules/blocks/serializers';
import { CanisterId } from '@/types';

import {
  CreatePageUpdateInput,
  CreatePageUpdateOutput,
} from '../../../../../declarations/workspace/workspace.did';

export const useCreatePage = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (
    input: Omit<CreatePageUpdateInput, 'uuid'>
  ) => Promise<CreatePageUpdateOutput>,
  { data: CreatePageUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useWorkspaceActor(options);
  const { put } = useDataStoreContext();
  const [_createPage, ...other] = useUpdate(canisterId, actor.createPage);
  const createPage = useCallback(
    (input: Omit<CreatePageUpdateInput, 'uuid'>) => {
      const uuid = uuidv4();
      return _createPage([{ ...input, uuid: uuidParse(uuid) }]).then((res) => {
        if ('err' in res) {
          throw new Error('There was an error creating the page.');
        }

        const page = blockSerializers.fromShareable(res.ok);
        put(DATA_TYPES.block, page.uuid, page, {
          prepareForStorage: blockSerializers.toLocalStorage,
        });
        put(DATA_TYPES.page, page.uuid, page, {
          prepareForStorage: blockSerializers.toLocalStorage,
        });

        return res;
      });
    },
    [_createPage, put]
  );

  return [createPage, ...other];
};
