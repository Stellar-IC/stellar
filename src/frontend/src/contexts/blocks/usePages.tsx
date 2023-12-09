import { Identity } from '@dfinity/agent';
import { useCallback, useEffect } from 'react';
import { stringify } from 'uuid';

import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import {
  fromLocalStorageBulk,
  fromShareable,
  toLocalStorageBulk,
} from '@/modules/domain/block/serializers';
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
  // ShareableBlock_v2 as ShareableBlock,
  UUID,
  BlockTypeUpdatedEvent,
  BlockProperyTitleUpdatedEvent,
  BlockProperyCheckedUpdatedEvent,
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
      prepareForStorage: toLocalStorageBulk,
      prepareFromStorage: fromLocalStorageBulk,
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
      prepareForStorage: toLocalStorageBulk,
      prepareFromStorage: fromLocalStorageBulk,
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
          updateLocalPage(stringify(edge.node.uuid), fromShareable(edge.node));
        });
      });
  }, [actor, updateLocalPage]);

  const { addEvent: storeEventLocally } = usePageEvents();

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

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

  const updateContent = useCallback(
    (event: BlockContentUpdatedEvent) => {
      const treeEvents = event.data.transaction;
      treeEvents.forEach((treeEvent) => {
        if ('insert' in treeEvent) {
          const parentExternalId = event.uuid;
          const contentExternalId = treeEvent.insert.value;

          updateLocalBlock(contentExternalId, {
            id: '',
            content: new Tree.Tree(),
            parent: stringify(parentExternalId),
            properties: {
              title: new Tree.Tree(),
              checked: false,
            },
            blockType: { paragraph: null },
            uuid: contentExternalId,
          });
        } else if ('delete' in treeEvent) {
          // TODO: Store change in local storage
        }
      });
    },
    [updateLocalBlock]
  );

  const processBlockEvent = useCallback(
    (blockExternalId: string, event: BlockEvent) => {
      storeEventLocally(blockExternalId, event);

      if ('blockUpdated' in event) {
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
      sendUpdate,
      storeEventLocally,
      updateBlockType,
      updateContent,
      updatePropertyChecked,
      updatePropertyTitle,
    ]
  );

  const handleBlockEvent = useCallback(
    (blockExternalId: UUID, event: BlockEvent) => {
      const block = blocks[stringify(blockExternalId)];
      if (!block) throw new Error('Block not found');
      processBlockEvent(block.uuid, event);
    },
    [blocks, processBlockEvent]
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
