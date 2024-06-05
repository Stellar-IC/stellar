import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { db } from '@/db';
import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/blocks/serializers';
import { store } from '@/modules/data-store';
import { Block, CanisterId } from '@/types';

export const usePagesQuery = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const query = useCallback(async () => {
    const result = await actor.pages({
      order: [],
      cursor: [],
      limit: [],
    });

    const { recordMap, pages } = result;

    // Save all blocks to data store
    store.blocks.bulkPut(
      recordMap.blocks.map((record) => {
        const block = blockSerializers.fromShareable(record[1]);
        return {
          key: block.uuid,
          value: blockSerializers.toLocalStorage(block),
        };
      })
    );

    // Save all blocks to data store
    await db.blocks.bulkPut(
      recordMap.blocks.map((record) => {
        const block = blockSerializers.fromShareable(record[1]);
        return blockSerializers.toLocalStorage(block);
      })
    );

    // Find the queried pages in the record map
    const pageRecords: Block[] = [];

    pages.edges.forEach((edge) => {
      const pageRecord = recordMap.blocks.find(
        (record) => record[0] === edge.node
      )?.[1];

      if (pageRecord) {
        pageRecords.push(blockSerializers.fromShareable(pageRecord));
      }
    });

    return pageRecords;
  }, [actor]);

  return query;
};
