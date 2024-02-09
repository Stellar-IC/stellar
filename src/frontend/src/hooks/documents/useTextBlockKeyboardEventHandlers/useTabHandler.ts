import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { Tree } from '@stellar-ic/lseq-ts';
import { Block, ExternalId } from '@/types';
import { useCallback, useMemo } from 'react';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { DATA_TYPES } from '@/constants';
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
    pages: { updateLocal: updateLocalPage },
    updateBlock,
  } = usePagesContext();
  const { get } = useDataStoreContext();

  const parentBlock = useMemo(
    () =>
      parentBlockExternalId
        ? get<Block>(DATA_TYPES.page, parentBlockExternalId) ||
          get<Block>(DATA_TYPES.block, parentBlockExternalId)
        : null,
    [get, parentBlockExternalId]
  );

  const doTabOperation = useCallback(() => {
    // Change the parent block of the current block
    if (blockIndex === 0) {
      // If the block is the first block, do nothing
      return false;
    }

    if (!parentBlock) return false;

    // Find the previous block
    const previousBlockExternalId = Tree.getNodeAtPosition(
      parentBlock.content,
      blockIndex - 1
    )?.value;
    if (!previousBlockExternalId) return false;

    const previousBlock = get<Block>(DATA_TYPES.block, previousBlockExternalId);
    if (!previousBlock) return false;

    const blockToMove = get<Block>(DATA_TYPES.block, blockExternalId);
    if (!blockToMove) return false;

    // Inserting at the end of the previous block's content
    const newBlockIndex = Tree.size(previousBlock.content);

    // Remove the block from its current position
    removeBlockContent(parentBlock, [blockIndex], {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
        if ('page' in updatedBlock.blockType) {
          updateLocalPage(updatedBlock.uuid, updatedBlock);
        }
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
          if ('page' in updatedBlock.blockType) {
            updateLocalPage(updatedBlock.uuid, updatedBlock);
          }
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
        if ('page' in updatedBlock.blockType) {
          updateLocalPage(updatedBlock.uuid, updatedBlock);
        }
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
  }, [
    blockIndex,
    blockExternalId,
    get,
    parentBlock,
    updateBlock,
    updateLocalBlock,
    updateLocalPage,
  ]);

  return doTabOperation;
};
