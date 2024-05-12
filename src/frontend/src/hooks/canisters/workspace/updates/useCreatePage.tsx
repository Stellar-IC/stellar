import { Identity } from '@dfinity/agent';
import { notifications } from '@mantine/notifications';
import { useCallback } from 'react';
import { v4 as uuidv4, parse as uuidParse, parse } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useUpdate } from '@/hooks/useUpdate';
import { serializeBlock } from '@/modules/blocks/serializers';
import { store } from '@/modules/data-store';
import { Tree } from '@/modules/lseq';
import { CanisterId } from '@/types';

import {
  CreatePageUpdateInput,
  CreatePageUpdateOutput,
} from '../../../../../../declarations/workspace/workspace.did';
import { useBlockQuery } from '../queries/useBlockQuery';

export const useCreatePage = (options: {
  identity: Identity;
  workspaceId: CanisterId;
}): [
  (
    input: Omit<CreatePageUpdateInput, 'uuid'>
  ) => Promise<CreatePageUpdateOutput>,
  { data: CreatePageUpdateOutput | null; isLoading: boolean }
] => {
  const { actor } = useWorkspaceContext();
  const [_createPage, ...other] = useUpdate(
    options.workspaceId,
    actor.createPage
  );
  const queryBlock = useBlockQuery();

  const createPage = useCallback(
    async (input: Omit<CreatePageUpdateInput, 'uuid'>) => {
      const uuid = uuidv4();
      const pageData = { ...input, uuid: uuidParse(uuid) };

      let result: CreatePageUpdateOutput;

      try {
        result = await _createPage([pageData]);
      } catch (e) {
        if (e instanceof Error) {
          notifications.show({
            title: 'Error',
            message: e.message,
            color: 'red',
          });
        }

        throw e;
      }

      if ('err' in result) {
        throw new Error(JSON.stringify(result.err));
      }

      const page = serializeBlock(result.ok);

      if (!page.content) {
        throw new Error('Page content is missing');
      }

      const initialBlockId = Tree.toArray(page.content)[0];

      if (!initialBlockId) {
        throw new Error('Initial block is missing');
      }

      const initialBlock = await queryBlock(parse(initialBlockId));

      if (!initialBlock) {
        throw new Error('Initial block is missing');
      }

      store.blocks.bulkPut(
        [page, initialBlock].map((block) => ({
          key: block.uuid,
          value: block,
        }))
      );
      await db.blocks.bulkPut([page, initialBlock]);

      return result;
    },
    [_createPage, queryBlock]
  );

  return [createPage, ...other];
};
