import { Identity } from '@dfinity/agent';
import { useCallback, useEffect } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import * as blockSerializers from '@/modules/domain/block/serializers';
import {
  Page,
  LocalStoragePage,
  Block,
  CanisterId,
  LocalStorageBlock,
} from '@/types';

import { Tree } from '@stellar-ic/lseq-ts';

import {
  BlockEvent,
  Result_1 as BlockByUuidResult,
  Result as PageByUuidResult,
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  UUID,
  BlockTypeUpdatedEvent,
  BlockProperyTitleUpdatedEvent,
  BlockProperyCheckedUpdatedEvent,
  BlockCreatedEvent,
  BlockContentUpdatedEvent,
} from '../../../../declarations/workspace/workspace.did';

import {
  getBlockExternalId,
  getPageExternalId,
  serializeBlock,
  serializePage,
} from '../../hooks/documents/utils';
import { useQuery } from '../../hooks/useQuery';

import { usePageEvents } from './usePageEvents';

export const usePages = (props: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const { identity, workspaceId } = props;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const {
    data: pages,
    query: queryPage,
    updateLocal: updateLocalPage,
  } = useQuery<[UUID], PageByUuidResult, Page, LocalStoragePage>(
    'pageByUUid',
    actor.pageByUuid,
    {
      serialize: serializePage,
      getExternalId: getPageExternalId,
      prepareForStorage: blockSerializers.toLocalStorageBulk,
      prepareFromStorage: blockSerializers.fromLocalStorageBulk,
    }
  );

  const {
    data: blocks,
    query: queryBlock,
    updateLocal: updateLocalBlock,
  } = useQuery<[UUID], BlockByUuidResult, Block, LocalStorageBlock>(
    'blockByUUid',
    actor.blockByUuid,
    {
      serialize: serializeBlock,
      getExternalId: getBlockExternalId,
      prepareForStorage: blockSerializers.toLocalStorageBulk,
      prepareFromStorage: blockSerializers.fromLocalStorageBulk,
    }
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
          updateLocalPage(
            stringify(edge.node.uuid),
            blockSerializers.fromShareable(edge.node)
          );
        });
      });
  }, [actor, updateLocalPage]);

  const { storeEventLocal } = usePageEvents();

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const updateContent = useCallback((_event: BlockContentUpdatedEvent) => {
    // TODO: Figure out what needs to happen here
  }, []);

  const createBlock = useCallback(
    (event: BlockCreatedEvent) => {
      if (!event.data.block.parent[0]) {
        return;
      }

      const blockExternalId = stringify(event.data.block.uuid);
      const parentExternalId = stringify(event.data.block.parent[0]);

      const parentBlock = blocks[parentExternalId];
      if (!parentBlock) {
        return;
      }

      // Add block to parent block's content
      Tree.insertCharacter(
        parentBlock.content,
        Number(event.data.index),
        blockExternalId,
        (_events) => {
          const contentUpdatedEvent: BlockContentUpdatedEvent = {
            uuid: parse(v4()),
            user: event.user,
            data: {
              blockExternalId: parse(parentBlock.uuid),
              transaction: _events,
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
        }
      );

      updateLocalBlock(parentExternalId, parentBlock);
      if ('page' in parentBlock.blockType) {
        updateLocalPage(parentExternalId, parentBlock);
      }

      // Create block locally
      updateLocalBlock(blockExternalId, {
        id: '', // this will be set by the backend
        content: new Tree.Tree(),
        parent: parentExternalId,
        properties: {
          title: new Tree.Tree(),
          checked: false,
        },
        blockType: event.data.block.blockType,
        uuid: blockExternalId,
      });
    },
    [blocks, sendUpdate, updateLocalBlock, updateLocalPage]
  );

  const updateBlockType = useCallback(
    (event: BlockTypeUpdatedEvent) => {
      const blockExternalId = stringify(event.data.blockExternalId);
      const currentBlock = blocks[blockExternalId];

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        blockType: event.data.blockType,
      });
    },
    [blocks, updateLocalBlock]
  );

  const updatePropertyChecked = useCallback(
    (event: BlockProperyCheckedUpdatedEvent) => {
      const blockExternalId = stringify(event.data.blockExternalId);
      const currentBlock = blocks[blockExternalId];

      updateLocalBlock(blockExternalId, {
        ...currentBlock,
        properties: {
          ...currentBlock.properties,
          checked: event.data.checked,
        },
      });
    },
    [blocks, updateLocalBlock]
  );

  const updatePropertyTitle = useCallback(
    (_event: BlockProperyTitleUpdatedEvent) => {
      // Do Nothing. This is handled in the Blocks component.
      // TODO: We should probably move that logic here.
    },
    []
  );

  const handleBlockEvent = useCallback(
    (blockExternalId: string, event: BlockEvent) => {
      storeEventLocal(blockExternalId, event);

      if ('blockCreated' in event) {
        createBlock(event.blockCreated);
      } else if ('blockUpdated' in event) {
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

      // send event to backend
      return sendUpdate([{ transaction: [event] }]);
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
    pages: {
      data: pages,
      query: queryPage,
      updateLocal: updateLocalPage,
    },
    blocks: {
      data: blocks,
      query: queryBlock,
      updateLocal: updateLocalBlock,
    },
    handleBlockEvent,
  };
};
