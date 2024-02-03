import { Identity } from '@dfinity/agent';
import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback, useEffect } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { useBlockByUuid } from '@/hooks/ic/workspace/queries/useBlockByUuid';
import { usePageByUuid } from '@/hooks/ic/workspace/queries/usePageByUuid';
import { useUpdate } from '@/hooks/useUpdate';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/serializers/block';
import { Page, Block, CanisterId } from '@/types';

import {
  BlockEvent,
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  BlockTypeUpdatedEvent,
  BlockProperyTitleUpdatedEvent,
  BlockProperyCheckedUpdatedEvent,
  BlockCreatedEvent,
  BlockContentUpdatedEvent,
} from '../../../../declarations/workspace/workspace.did';

import { usePageEvents } from './usePageEvents';
import { useDataStoreContext } from '../DataStoreContext/useDataStoreContext';

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
      if (!event.data.block.parent[0]) {
        return null;
      }

      const blockExternalId = stringify(event.data.block.uuid);
      const parentExternalId = stringify(event.data.block.parent[0]);

      const parentBlock = get<Block>(DATA_TYPES.block, parentExternalId);
      if (!parentBlock) {
        return null;
      }

      // Add block to parent block's content
      const events = Tree.insertCharacter(
        parentBlock.content,
        Number(event.data.index),
        blockExternalId
      );
      const contentUpdatedEvent: BlockContentUpdatedEvent = {
        uuid: parse(v4()),
        user: event.user,
        data: {
          blockExternalId: parse(parentBlock.uuid),
          transaction: events,
        },
      };
      sendUpdate([
        {
          transaction: [
            {
              blockUpdated: {
                updateContent: contentUpdatedEvent,
              },
            },
          ],
        },
      ]);

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
        blockType: event.data.block.blockType,
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
      const blockExternalId = stringify(event.data.blockExternalId);
      const currentBlock = get<Block>(DATA_TYPES.block, blockExternalId);
      if (!currentBlock) {
        return;
      }

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        blockType: event.data.blockType,
      });
    },
    [get, updateLocalBlock]
  );

  const updatePropertyChecked = useCallback(
    (event: BlockProperyCheckedUpdatedEvent) => {
      const blockExternalId = stringify(event.data.blockExternalId);
      const currentBlock = get<Block>(DATA_TYPES.block, blockExternalId);
      if (!currentBlock) {
        return;
      }

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        properties: {
          ...currentBlock.properties,
          checked: event.data.checked,
        },
      });
    },
    [get, updateLocalBlock]
  );

  const updatePropertyTitle = useCallback(
    (_event: BlockProperyTitleUpdatedEvent) => {
      // Do Nothing. This is handled in the Blocks component.
      // TODO: We should probably move that logic here.
    },
    []
  );

  const handleBlockEvent = useCallback(
    (blockExternalId: string, event: BlockEvent): Block | null => {
      storeEventLocal(blockExternalId, event);

      let block: Block | null = null;

      if ('blockCreated' in event) {
        block = createBlock(event.blockCreated);
      }

      if ('blockUpdated' in event) {
        block = get<Block>(DATA_TYPES.block, blockExternalId);
        if ('updateContent' in event.blockUpdated) {
          updateContent(event.blockUpdated.updateContent);
        } else if ('updateBlockType' in event.blockUpdated) {
          updateBlockType(event.blockUpdated.updateBlockType);
        } else if ('updatePropertyTitle' in event.blockUpdated) {
          updatePropertyTitle(event.blockUpdated.updatePropertyTitle);
        } else if ('updatePropertyChecked' in event.blockUpdated) {
          updatePropertyChecked(event.blockUpdated.updatePropertyChecked);
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
