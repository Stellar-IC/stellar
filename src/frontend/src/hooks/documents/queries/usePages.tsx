import { Identity } from '@dfinity/agent';
import { useCallback, useEffect } from 'react';
import { parse, stringify } from 'uuid';

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
  ExternalId,
} from '@/types';

import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { Tree } from '@/modules/lseq';
import {
  BlockCreatedEvent,
  BlockEvent,
  BlockRemovedEvent,
  BlockUpdatedEvent,
  Result_1 as BlockByUuidResult,
  Result as PageByUuidResult,
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  ShareableBlock,
  UUID,
  TreeEvent,
} from '../../../../../declarations/workspace/workspace.did';
import { canisterId } from '../../../../../declarations/workspace';
import { useQuery } from '../../useQuery';
import { usePageEvents } from './usePageEvents';

const getPageExternalId = (result: PageByUuidResult): UUID | null =>
  'ok' in result ? result.ok.uuid : null;

const getBlockExternalId = (result: BlockByUuidResult): UUID | null =>
  'ok' in result ? result.ok.uuid : null;

export const usePages = (props: {
  workspaceId: CanisterId;
  identity: Identity;
}) => {
  const {
    identity,
    // updateLocalBlock,
    workspaceId,
  } = props;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const serializePage = useCallback((result: PageByUuidResult) => {
    if (!('ok' in result)) return null;
    return fromShareable(result.ok);
  }, []);
  const serializeBlock = useCallback((result: BlockByUuidResult) => {
    if (!('ok' in result)) return null;
    return fromShareable(result.ok);
  }, []);

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

  const { addEvent } = usePageEvents();

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(canisterId, actor.saveEvents);

  const insertCharacter = useCallback(
    async (blockExternalId: string, position: number, character: string) => {
      if (character.length > 1) throw new Error('Only one character allowed');

      const block = blocks[blockExternalId];
      const { title } = block.properties;
      const isAtStart = position === 0;
      const isAtEnd = position === Tree.size(title);

      if (isAtStart) {
        const { node, deletedNode, replacementNode } =
          Tree.insertCharacterAtStart(title, character);
        const events: TreeEvent[] = [
          {
            insert: {
              position: node.identifier.value,
              value: node.value,
              transactionType: {
                insert: null,
              },
            },
          },
        ];

        if (deletedNode) {
          events.push({
            delete: {
              position: deletedNode.identifier.value,
              transactionType: {
                delete: null,
              },
            },
          });
        }

        if (replacementNode) {
          events.push({
            insert: {
              position: replacementNode.identifier.value,
              value: replacementNode.value,
              transactionType: {
                insert: null,
              },
            },
          });
        }

        sendUpdate([
          {
            transaction: events.map((event) => ({
              blockUpdated: {
                updatePropertyTitle: {
                  user: identity.getPrincipal(),
                  uuid: parse(blockExternalId),
                  data: {
                    blockExternalId: parse(blockExternalId),
                    event,
                  },
                },
              },
            })),
          },
        ]);

        updateLocalBlock(blockExternalId, {
          ...block,
          properties: { ...block.properties, title },
        });
        return;
      }

      if (isAtEnd) {
        const insertedNode = Tree.insertCharacterAtEnd(title, character);
        const events: TreeEvent[] = [
          {
            insert: {
              position: insertedNode.identifier.value,
              value: insertedNode.value,
              transactionType: {
                insert: null,
              },
            },
          },
        ];
        sendUpdate([
          {
            transaction: [
              {
                blockUpdated: {
                  updatePropertyTitle: {
                    user: identity.getPrincipal(),
                    uuid: parse(blockExternalId),
                    data: {
                      blockExternalId: parse(blockExternalId),
                      event: events[0],
                    },
                  },
                },
              },
            ],
          },
        ]);
        updateLocalBlock(blockExternalId, {
          ...block,
          properties: { ...block.properties, title },
        });
        return;
      }

      const insertedNode = Tree.insertCharacterAtPosition(
        title,
        character,
        position
      );
      const event: TreeEvent = {
        insert: {
          position: insertedNode.identifier.value,
          value: insertedNode.value,
          transactionType: {
            insert: null,
          },
        },
      };

      sendUpdate([
        {
          transaction: [
            {
              blockUpdated: {
                updatePropertyTitle: {
                  user: identity.getPrincipal(),
                  uuid: parse(blockExternalId),
                  data: {
                    event,
                    blockExternalId: parse(blockExternalId),
                  },
                },
              },
            },
          ],
        },
      ]);
      updateLocalBlock(blockExternalId, {
        ...block,
        properties: { ...block.properties, title },
      });
    },
    [blocks, identity, sendUpdate, updateLocalBlock]
  );

  const removeCharacter = useCallback(
    async (blockExternalId: string, position: number) => {
      const block = blocks[blockExternalId];
      const { title } = block.properties;
      const isAtStart = position === 0;

      if (isAtStart) return;

      const nodeBeforeCursor = Tree.getNodeAtPosition(title, position - 1);

      if (!nodeBeforeCursor) {
        throw new Error(
          'There was an error finding the node before the cursor'
        );
      }

      title.delete(nodeBeforeCursor.identifier);

      const event: TreeEvent = {
        delete: {
          position: nodeBeforeCursor.identifier.value,
          transactionType: {
            delete: null,
          },
        },
      };

      sendUpdate([
        {
          transaction: [
            {
              blockUpdated: {
                updatePropertyTitle: {
                  user: identity.getPrincipal(),
                  uuid: parse(blockExternalId),
                  data: {
                    event,
                    blockExternalId: parse(blockExternalId),
                  },
                },
              },
            },
          ],
        },
      ]);

      updateLocalBlock(blockExternalId, {
        ...block,
        properties: { ...block.properties, title },
      });
    },
    [blocks, identity, sendUpdate, updateLocalBlock]
  );

  const saveEvent = useCallback(
    async (pageExternalId: string, event: BlockEvent) => {
      if ('blockCreated' in event) {
        const { index, block } = event.blockCreated.data;
        const blockUuid = stringify(block.uuid);

        // store event locally
        addEvent(pageExternalId, event);

        const currentPage = pages[pageExternalId];
        const newContent = [...currentPage.content];
        newContent.splice(Number(index), 0, blockUuid);

        // update page locally
        updateLocalPage(pageExternalId, {
          ...currentPage,
          content: newContent,
        });

        console.log({
          blockType: block.blockType,
        });

        updateLocalBlock(blockUuid, {
          id: '',
          content: [],
          ...block,
          parent: pageExternalId,
          properties: {
            title: new Tree.Tree(),
            checked: false,
          },
          uuid: blockUuid,
        });

        // send event to IC
        const result = await sendUpdate([{ transaction: [event] }]);
        return result;
      }

      if ('blockRemoved' in event) {
        // store event locally
        addEvent(pageExternalId, event);

        const currentPage = pages[pageExternalId];
        const updatedContent = currentPage.content.filter(
          (id) => id !== stringify(event.blockRemoved.data.blockExternalId)
        );

        // update page locally
        updateLocalPage(pageExternalId, {
          ...currentPage,
          content: updatedContent,
        });

        // send event to IC
        const result = await sendUpdate([{ transaction: [event] }]);
        return result;
      }

      if ('blockUpdated' in event) {
        // store event locally
        addEvent(pageExternalId, event);

        // update block locally
        if ('updateBlockType' in event.blockUpdated) {
          const blockExternalId = stringify(
            event.blockUpdated.updateBlockType.data.blockExternalId
          );
          const currentBlock = blocks[blockExternalId];

          updateLocalBlock(blockExternalId, {
            ...currentBlock,
            blockType: event.blockUpdated.updateBlockType.data.blockType,
          });
        } else if ('updatePropertyTitle' in event.blockUpdated) {
          // Do Nothing. This is handled in the Blocks component.
          // TODO: We should probably move that logic here.
        }

        // send event to IC
        const result = await sendUpdate([{ transaction: [event] }]);
        return result;
      }

      throw new Error('Unsupported event type');
    },
    [addEvent, blocks, pages, sendUpdate, updateLocalBlock, updateLocalPage]
  );

  const handleAddBlock = useCallback(
    (pageExternalId: ExternalId, event: BlockCreatedEvent) => {
      const newBlock: Omit<ShareableBlock, 'id'> = {
        content: [],
        parent: [parse(pageExternalId)],
        uuid: event.data.block.uuid,
        blockType: { paragraph: null },
        properties: {
          title: [],
          checked: [false],
        },
      };

      const updatedData: Block = fromShareable({
        // TODO: What to do with id? Will this cause issues?
        id: BigInt(0),
        ...newBlock,
      });

      updateLocalBlock(updatedData.uuid, updatedData);

      saveEvent(pageExternalId, {
        blockCreated: event,
      });
    },
    [saveEvent, updateLocalBlock]
  );

  const handleRemoveBlock = useCallback(
    (pageExternalId: ExternalId, event: BlockRemovedEvent) => {
      saveEvent(pageExternalId, {
        blockRemoved: event,
      });
    },
    [saveEvent]
  );

  const handleUpdateBlock = useCallback(
    (pageExternalId: ExternalId, event: BlockUpdatedEvent) => {
      saveEvent(pageExternalId, { blockUpdated: event });
    },
    [saveEvent]
  );

  const handleBlockEvent = useCallback(
    (pageExternalId: UUID, event: BlockEvent) => {
      const page = pages[stringify(pageExternalId)];

      if (!page) throw new Error('Page not found');

      // For each event we need to update the page appropriately.
      if ('blockCreated' in event) {
        handleAddBlock(page.uuid, event.blockCreated);
      } else if ('blockRemoved' in event) {
        handleRemoveBlock(page.uuid, event.blockRemoved);
      } else if ('blockUpdated' in event) {
        handleUpdateBlock(page.uuid, event.blockUpdated);
      } else {
        throw new Error('Unsupported event type');
      }
    },
    [handleAddBlock, handleUpdateBlock, handleRemoveBlock, pages]
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
    insertCharacter,
    removeCharacter,
  };
};
