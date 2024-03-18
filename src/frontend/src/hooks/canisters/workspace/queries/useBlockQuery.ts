import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { db } from '@/db';
import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/blocks/serializers';
import { Block, CanisterId } from '@/types';

import { UUID } from '../../../../../../declarations/workspace/workspace.did';

export const useBlockQuery = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}): ((uuid: UUID) => Promise<Block | null>) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const query = useCallback(
    async (uuid: UUID) => {
      const result = await actor.block(uuid, {
        contentPagination: {
          limit: 10n,
          cursor: 0n,
        },
      });

      if (!('ok' in result)) return null;

      const { block: blockId, recordMap } = result.ok;

      // Save all blocks to data store
      await db.blocks.bulkPut(
        recordMap.blocks.map((record) => {
          const block = blockSerializers.fromShareable(record[1]);
          return blockSerializers.toLocalStorage(block);
        })
      );

      // Find the queried block in the record map
      const block = recordMap.blocks.find(
        (record) => record[0] === blockId
      )?.[1];

      if (!block) return null;

      return blockSerializers.fromShareable(block);
    },
    [actor]
  );

  return query;
};
