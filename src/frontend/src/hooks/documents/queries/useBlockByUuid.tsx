import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { fromShareable } from '@/modules/domain/block/serializers';
import { Tree } from '@/modules/lseq';
import { Block, CanisterId } from '@/types';
import { canisterId } from '../../../../../declarations/workspace';

import {
  SaveEventUpdateInput,
  SaveEventUpdateOutput,
  ShareableBlock,
  BlockUpdatedEventTransaction,
} from '../../../../../declarations/workspace/workspace.did';

export const useBlockByUuid = (props: {
  workspaceId: CanisterId;
  identity: Identity;
  onSuccess?: (result: ShareableBlock) => void;
}) => {
  const { onSuccess: onSuccessFromProps, identity, workspaceId } = props || {};
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const { blocks: blocksContext } = usePagesContext();
  const { data: blocks, query, updateLocal } = blocksContext;

  const getBlockByUuid = useCallback(
    (blockExternalId: string): Promise<Block> => {
      const block = blocks[blockExternalId];

      if (!block) {
        return query(parse(blockExternalId))
          .then((result) => {
            if ('ok' in result) return fromShareable(result.ok);
            throw new Error('Block not found');
          })
          .catch((err) => {
            console.error(err);
            throw err;
          });
      }

      return Promise.resolve(block);
    },
    [blocks, query]
  );

  const [sendUpdate, { data: updateData, isLoading }] = useUpdate<
    [SaveEventUpdateInput],
    SaveEventUpdateOutput
  >(canisterId, actor.saveEvent);

  const insertCharacter = useCallback(
    async (blockExternalId: string, position: number, character: string) => {
      if (character.length > 1) throw new Error('Only one character allowed');

      const block = await getBlockByUuid(blockExternalId);
      const { title } = block.properties;
      const isAtStart = position === 0;
      const isAtEnd = position === Tree.size(title);

      if (isAtStart) {
        const { node, deletedNode, replacementNode } =
          Tree.insertCharacterAtStart(title, character);
        const transactions: BlockUpdatedEventTransaction[] = [
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
          transactions.push({
            delete: {
              position: deletedNode.identifier.value,
              transactionType: {
                delete: null,
              },
            },
          });
        }

        if (replacementNode) {
          transactions.push({
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
            blockUpdated: {
              eventType: { blockUpdated: null },
              payload: {
                transactions,
                blockExternalId: parse(blockExternalId),
              },
            },
          },
        ]);

        updateLocal(blockExternalId, {
          ...block,
          properties: { ...block.properties, title },
        });
        return;
      }

      if (isAtEnd) {
        const insertedNode = Tree.insertCharacterAtEnd(title, character);
        const transactions: BlockUpdatedEventTransaction[] = [
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
            blockUpdated: {
              eventType: { blockUpdated: null },
              payload: {
                transactions,
                blockExternalId: parse(blockExternalId),
              },
            },
          },
        ]);
        updateLocal(blockExternalId, {
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
      const transactions: BlockUpdatedEventTransaction[] = [
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
          blockUpdated: {
            eventType: { blockUpdated: null },
            payload: {
              transactions,
              blockExternalId: parse(blockExternalId),
            },
          },
        },
      ]);
      updateLocal(blockExternalId, {
        ...block,
        properties: { ...block.properties, title },
      });
    },
    [getBlockByUuid, sendUpdate, updateLocal]
  );

  const removeCharacter = useCallback(
    async (blockExternalId: string, position: number) => {
      const block = await getBlockByUuid(blockExternalId);
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

      const transactions: BlockUpdatedEventTransaction[] = [
        {
          delete: {
            position: nodeBeforeCursor.identifier.value,
            transactionType: {
              delete: null,
            },
          },
        },
      ];
      sendUpdate([
        {
          blockUpdated: {
            eventType: { blockUpdated: null },
            payload: {
              transactions,
              blockExternalId: parse(blockExternalId),
            },
          },
        },
      ]);
      updateLocal(blockExternalId, {
        ...block,
        properties: { ...block.properties, title },
      });
    },
    [getBlockByUuid, sendUpdate, updateLocal]
  );

  return {
    blocks,
    getBlockByUuid,
    query,
    isLoading: false,
    insertCharacter,
    removeCharacter,
  };
};
