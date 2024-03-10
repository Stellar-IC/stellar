import { Tree } from '@stellar-ic/lseq-ts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { db } from '@/db';
import { ExternalId } from '@/types';

import {
  insertBlockContent,
  removeBlockContent,
  updateBlockParent,
} from './utils';

type UseTabHandler = {
  blockIndex: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
};

export const useTabHandler = ({
  blockIndex,
  blockExternalId,
  parentBlockExternalId,
}: UseTabHandler) => {
  const {
    blocks: { updateLocal: updateLocalBlock },
    updateBlock,
  } = usePagesContext();

  const parentBlock = useLiveQuery(() =>
    parentBlockExternalId ? db.blocks.get(parentBlockExternalId) : undefined
  );

  const previousBlock = useLiveQuery(() => {
    if (!parentBlock) return undefined;

    const previousBlockExternalId = Tree.getNodeAtPosition(
      parentBlock.content,
      blockIndex - 1
    )?.value;

    if (!previousBlockExternalId) return undefined;

    return db.blocks.get(previousBlockExternalId);
  }, [blockIndex, parentBlock]);

  const blockToMove = useLiveQuery(
    () => db.blocks.get(blockExternalId),
    [blockExternalId]
  );

  const doTabOperation = useCallback(() => {
    if (blockIndex === 0) {
      return false;
    }
    if (!parentBlock) return false;
    if (!previousBlock) return false;
    if (!blockToMove) return false;

    const previousBlockExternalId = previousBlock.uuid;

    // Inserting at the end of the previous block's content
    const newBlockIndex = Tree.size(previousBlock.content);

    // Remove the block from its current position
    removeBlockContent(parentBlock, [blockIndex], {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
      },
      onUpdateRemote: (updatedBlock, events) => {
        const blockExternalId = parse(updatedBlock.uuid);
        updateBlock(blockExternalId, {
          updateContent: {
            data: {
              blockExternalId,
              transaction: events,
            },
          },
        });
      },
    });

    // Add the block to the new position
    insertBlockContent(
      previousBlock,
      [{ index: newBlockIndex, item: blockToMove.uuid }],
      {
        onUpdateLocal: (updatedBlock) => {
          updateLocalBlock(updatedBlock.uuid, updatedBlock);
        },
        onUpdateRemote: (updatedBlock, events) => {
          const blockExternalId = parse(updatedBlock.uuid);
          updateBlock(blockExternalId, {
            updateContent: {
              data: {
                blockExternalId,
                transaction: events,
              },
            },
          });
        },
      }
    );

    // Update the block's parent on chain
    updateBlockParent(blockToMove, previousBlockExternalId, {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
      },
      onUpdateRemote: (updatedBlock) => {
        const blockExternalId = parse(updatedBlock.uuid);
        updateBlock(blockExternalId, {
          updateParent: {
            data: {
              blockExternalId,
              parentBlockExternalId: parse(previousBlockExternalId),
            },
          },
        });
      },
    });

    return true;
  }, [
    blockIndex,
    parentBlock,
    blockToMove,
    previousBlock,
    updateBlock,
    updateLocalBlock,
  ]);

  return doTabOperation;
};
