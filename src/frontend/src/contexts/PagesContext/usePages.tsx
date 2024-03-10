import { Identity } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback, useEffect } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { db } from '@/db';
import { useBlockQuery } from '@/hooks/canisters/workspace/queries/useBlockQuery';
import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import * as blockSerializers from '@/modules/blocks/serializers';
import { Block, CanisterId } from '@/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockCreatedEventData,
  BlockEvent,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

import { usePageEvents } from './usePageEvents';

type CoreBlockEvent = {
  user: Principal;
  uuid: UUID;
  timestamp: bigint;
};

type BlockContentUpdatedEvent = CoreBlockEvent & {
  data: { blockUpdated: { updateContent: BlockContentUpdatedEventData } };
};

type BlockPropertyCheckedUpdatedEvent = CoreBlockEvent & {
  data: {
    blockUpdated: {
      updatePropertyChecked: BlockPropertyCheckedUpdatedEventData;
    };
  };
};

type BlockPropertyTitleUpdatedEvent = CoreBlockEvent & {
  data: {
    blockUpdated: { updatePropertyTitle: BlockPropertyTitleUpdatedEventData };
  };
};

type BlockTypeUpdatedEvent = CoreBlockEvent & {
  data: { blockUpdated: { updateBlockType: BlockBlockTypeUpdatedEventData } };
};

type BlockCreatedEvent = CoreBlockEvent & {
  data: { blockCreated: BlockCreatedEventData };
};

export const usePages = (props: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const { identity, workspaceId } = props;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const queryBlock = useBlockQuery({ identity, workspaceId });

  const updateLocalPage = useCallback(
    (externalId: string, updatedData: Block) => {
      const serializedData = blockSerializers.toLocalStorage(updatedData);
      db.blocks.put(serializedData, externalId);
    },
    []
  );

  const updateLocalBlock = useCallback(
    (externalId: string, updatedData: Block) => {
      const serializedData = blockSerializers.toLocalStorage(updatedData);
      db.blocks.put(serializedData, externalId);
    },
    []
  );

  useEffect(() => {
    actor
      .pages({
        order: [],
        cursor: [],
        limit: [],
      })
      .then(async (res) => {
        // Save all blocks to data store
        await db.blocks.bulkPut(
          res.recordMap.blocks.map((record) => {
            const block = blockSerializers.fromShareable(record[1]);
            return blockSerializers.toLocalStorage(block);
          })
        );
      });
  }, [actor, updateLocalBlock, updateLocalPage]);

  const { storeEventLocal } = usePageEvents({
    storageAdapter: {
      put: async (item, key) => {
        await db.blockEvents.put(item, key);
      },
    },
  });

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const updateContent = useCallback((_event: BlockContentUpdatedEvent) => {
    // TODO: Figure out what needs to happen here
  }, []);

  const createBlock = useCallback(
    async (event: BlockCreatedEvent): Promise<Block | undefined> => {
      if (!event.data.blockCreated.block.parent[0]) {
        return undefined;
      }

      const eventData = event.data.blockCreated;
      const blockExternalId = stringify(event.data.blockCreated.block.uuid);
      const parentExternalId = eventData.block.parent[0]
        ? stringify(eventData.block.parent[0])
        : null;

      if (!parentExternalId) {
        return undefined;
      }

      const parentBlock = await db.blocks.get(parentExternalId);

      if (!parentBlock) {
        return undefined;
      }

      // Add block to parent block's content
      const events = Tree.insertCharacter(
        parentBlock.content,
        Number(event.data.blockCreated.index),
        blockExternalId
      );
      const contentUpdatedEvent: BlockContentUpdatedEvent = {
        uuid: parse(v4()),
        user: event.user,
        data: {
          blockUpdated: {
            updateContent: {
              blockExternalId: parse(parentBlock.uuid),
              transaction: events,
            },
          },
        },
        timestamp: BigInt(Date.now()),
      };
      sendUpdate([{ transaction: [contentUpdatedEvent] }]);

      updateLocalBlock(parentExternalId, parentBlock);

      const newBlock = {
        content: new Tree.Tree(),
        parent: parentExternalId,
        properties: {
          title: new Tree.Tree(),
          checked: false,
        },
        blockType: event.data.blockCreated.block.blockType,
        uuid: blockExternalId,
      };

      // Create block locally
      updateLocalBlock(blockExternalId, newBlock);

      return newBlock;
    },
    [sendUpdate, updateLocalBlock]
  );

  const updateBlockType = useCallback(
    async (event: BlockTypeUpdatedEvent) => {
      const blockExternalId = stringify(
        event.data.blockUpdated.updateBlockType.blockExternalId
      );
      const currentBlock = await db.blocks
        .where('uuid')
        .equals(blockExternalId)
        .first();

      if (!currentBlock) {
        return;
      }

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        blockType: event.data.blockUpdated.updateBlockType.blockType,
      });
    },
    [updateLocalBlock]
  );

  const updatePropertyChecked = useCallback(
    async (event: BlockPropertyCheckedUpdatedEvent) => {
      const blockExternalId = stringify(
        event.data.blockUpdated.updatePropertyChecked.blockExternalId
      );
      const currentBlock = await db.blocks
        .where('uuid')
        .equals(blockExternalId)
        .first();

      if (!currentBlock) {
        return;
      }

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        properties: {
          ...currentBlock.properties,
          checked: event.data.blockUpdated.updatePropertyChecked.checked,
        },
      });
    },
    [updateLocalBlock]
  );

  const updatePropertyTitle = useCallback(
    (_event: BlockPropertyTitleUpdatedEvent) => {
      // Do Nothing. This is handled in the Blocks component.
      // TODO: We should probably move that logic here.
    },
    []
  );

  const handleBlockEvent = useCallback(
    async (
      blockExternalId: string,
      event: BlockEvent
    ): Promise<Block | undefined> => {
      storeEventLocal(blockExternalId, event);

      let block: Block | undefined;

      if ('blockCreated' in event.data) {
        block = await createBlock({ ...event, data: { ...event.data } });
      }

      if ('blockUpdated' in event.data) {
        block = await db.blocks.get(blockExternalId);

        if ('updateContent' in event.data.blockUpdated) {
          updateContent({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        } else if ('updateBlockType' in event.data.blockUpdated) {
          updateBlockType({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        } else if ('updatePropertyTitle' in event.data.blockUpdated) {
          updatePropertyTitle({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        } else if ('updatePropertyChecked' in event.data.blockUpdated) {
          updatePropertyChecked({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        }
      }

      sendUpdate([{ transaction: [event] }]);

      return block;
    },
    [
      createBlock,
      sendUpdate,
      storeEventLocal,
      updateBlockType,
      updateContent,
      updatePropertyChecked,
      updatePropertyTitle,
    ]
  );

  return {
    blocks: {
      query: queryBlock,
      updateLocal: updateLocalBlock,
    },
    handleBlockEvent,
  };
};
