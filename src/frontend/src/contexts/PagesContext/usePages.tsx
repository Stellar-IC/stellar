import { Identity } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback, useEffect } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { useBlockByUuid } from '@/hooks/ic/workspace/queries/useBlockByUuid';
import { usePageByUuid } from '@/hooks/ic/workspace/queries/usePageByUuid';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import * as blockSerializers from '@/modules/blocks/serializers';
import { Page, Block, CanisterId } from '@/types';

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
import { useDataStoreContext } from '../DataStoreContext/useDataStoreContext';

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

  const { get, put } = useDataStoreContext();

  const queryBlock = useBlockByUuid({ identity, workspaceId });
  const queryPage = usePageByUuid({ identity, workspaceId });

  const updateLocalPage = useCallback(
    (externalId: string, updatedData: Page) => {
      put(DATA_TYPES.page, externalId, updatedData, {
        prepareForStorage: blockSerializers.toLocalStorage,
      });
    },
    [put]
  );

  const updateLocalBlock = useCallback(
    (externalId: string, updatedData: Block) => {
      put(DATA_TYPES.block, externalId, updatedData, {
        prepareForStorage: blockSerializers.toLocalStorage,
      });
    },
    [put]
  );

  useEffect(() => {
    actor
      .pages({
        order: [],
        cursor: [],
        limit: [],
      })
      .then((res) => {
        res.edges.forEach((edge) => {
          updateLocalBlock(
            stringify(edge.node.uuid),
            blockSerializers.fromShareable(edge.node)
          );
          updateLocalPage(
            stringify(edge.node.uuid),
            blockSerializers.fromShareable(edge.node)
          );
        });
      });
  }, [actor, updateLocalBlock, updateLocalPage]);

  const { storeEventLocal } = usePageEvents();

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const updateContent = useCallback((_event: BlockContentUpdatedEvent) => {
    // TODO: Figure out what needs to happen here
  }, []);

  const createBlock = useCallback(
    (event: BlockCreatedEvent): Block | null => {
      if (!event.data.blockCreated.block.parent[0]) {
        return null;
      }

      const eventData = event.data.blockCreated;
      const blockExternalId = stringify(event.data.blockCreated.block.uuid);
      const parentExternalId = eventData.block.parent[0]
        ? stringify(eventData.block.parent[0])
        : null;

      if (!parentExternalId) {
        return null;
      }

      const parentBlock = get<Block>(DATA_TYPES.block, parentExternalId);

      if (!parentBlock) {
        return null;
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
      if ('page' in parentBlock.blockType) {
        updateLocalPage(parentExternalId, parentBlock);
      }

      const newBlock = {
        id: '', // this will be set by the backend
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
    [get, sendUpdate, updateLocalBlock, updateLocalPage]
  );

  const updateBlockType = useCallback(
    (event: BlockTypeUpdatedEvent) => {
      const blockExternalId = stringify(
        event.data.blockUpdated.updateBlockType.blockExternalId
      );
      const currentBlock = get<Block>(DATA_TYPES.block, blockExternalId);
      if (!currentBlock) {
        return;
      }

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        blockType: event.data.blockUpdated.updateBlockType.blockType,
      });
    },
    [get, updateLocalBlock]
  );

  const updatePropertyChecked = useCallback(
    (event: BlockPropertyCheckedUpdatedEvent) => {
      const blockExternalId = stringify(
        event.data.blockUpdated.updatePropertyChecked.blockExternalId
      );
      const currentBlock = get<Block>(DATA_TYPES.block, blockExternalId);
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
    [get, updateLocalBlock]
  );

  const updatePropertyTitle = useCallback(
    (_event: BlockPropertyTitleUpdatedEvent) => {
      // Do Nothing. This is handled in the Blocks component.
      // TODO: We should probably move that logic here.
    },
    []
  );

  const handleBlockEvent = useCallback(
    (blockExternalId: string, event: BlockEvent): Block | null => {
      storeEventLocal(blockExternalId, event);

      let block: Block | null = null;

      if ('blockCreated' in event.data) {
        block = createBlock({ ...event, data: { ...event.data } });
      }

      if ('blockUpdated' in event.data) {
        block = get<Block>(DATA_TYPES.block, blockExternalId);

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
      get,
      sendUpdate,
      storeEventLocal,
      updateBlockType,
      updateContent,
      updatePropertyChecked,
      updatePropertyTitle,
    ]
  );

  return {
    pages: {
      query: queryPage,
      updateLocal: updateLocalPage,
    },
    blocks: {
      query: queryBlock,
      updateLocal: updateLocalBlock,
    },
    handleBlockEvent,
  };
};
