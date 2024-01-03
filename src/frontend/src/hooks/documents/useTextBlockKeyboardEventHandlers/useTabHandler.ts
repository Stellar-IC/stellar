import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { Tree } from '@stellar-ic/lseq-ts';
import { Block, ExternalId } from '@/types';
import { useCallback, useMemo } from 'react';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { DATA_TYPES } from '@/constants';

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
    const previousBlock = get<Block>(DATA_TYPES.block, previousBlockExternalId);
    if (!previousBlock) return false;

    const blockToMove = get<Block>(DATA_TYPES.block, blockExternalId);
    if (!blockToMove) return false;

    const newBlockIndex = Tree.size(previousBlock.content);

    // Remove the block from its current position
    Tree.removeCharacter(parentBlock.content, blockIndex + 1, (event) => {
      updateBlock(parse(parentBlock.uuid), {
        updateContent: {
          data: {
            blockExternalId: parse(parentBlock.uuid),
            transaction: [event],
          },
        },
      });
    });
    updateLocalBlock(parentBlock.uuid, parentBlock);

    // Add the block to the new position
    Tree.insertCharacter(
      previousBlock.content,
      newBlockIndex,
      blockToMove.uuid,
      (events) => {
        // Update the previous block's content to include the new block
        updateBlock(parse(previousBlockExternalId), {
          updateContent: {
            data: {
              blockExternalId: parse(previousBlockExternalId),
              transaction: events,
            },
          },
        });
      }
    );
    updateLocalBlock(previousBlock.uuid, previousBlock);

    blockToMove.parent = previousBlockExternalId;

    // Update the block's parent on chain
    updateBlock(parse(blockExternalId), {
      updateParent: {
        data: {
          blockExternalId: parse(blockExternalId),
          parentBlockExternalId: parse(previousBlockExternalId),
        },
      },
    });
  }, [
    blockIndex,
    blockExternalId,
    get,
    parentBlock,
    updateBlock,
    updateLocalBlock,
  ]);

  return doTabOperation;
};
