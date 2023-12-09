import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Tree } from '@stellar-ic/lseq-ts';
import { ExternalId } from '@/types';
import { useCallback, useMemo } from 'react';

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
    pages: { data: pages },
    blocks: { data: blocks, updateLocal: updateLocalBlock },
    updateBlock,
  } = usePagesContext();

  const parentBlock = useMemo(
    () =>
      parentBlockExternalId
        ? pages[parentBlockExternalId] || blocks[parentBlockExternalId]
        : null,
    [pages, blocks, parentBlockExternalId]
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
    const previousBlock = blocks[previousBlockExternalId];
    if (!previousBlock) return false;

    const blockToMove = blocks[blockExternalId];
    if (!blockToMove) return false;

    // Update the block's parent on chain
    updateBlock(parse(blockExternalId), {
      updateParent: {
        data: {
          blockExternalId: parse(blockExternalId),
          parentBlockExternalId: parse(previousBlockExternalId),
        },
      },
    });

    // Update the previous block's content to include the new block
    updateBlock(parse(previousBlockExternalId), {
      updateContent: {
        data: {
          blockExternalId: parse(previousBlockExternalId),
          transaction: [
            {
              insert: {
                transactionType: { insert: null },
                position: Tree.buildNodeForEndInsert(
                  previousBlock.content,
                  blockToMove.uuid
                ).identifier.value,
                value: blockToMove.uuid,
              },
            },
          ],
        },
      },
    });

    updateBlock(parse(parentBlock.uuid), {
      updateContent: {
        data: {
          blockExternalId: parse(parentBlock.uuid),
          transaction: [
            {
              delete: {
                transactionType: { delete: null },
                position: Tree.getNodeAtPosition(
                  parentBlock.content,
                  blockIndex
                ).identifier.value,
              },
            },
          ],
        },
      },
    });

    const newBlockIndex = Tree.size(previousBlock.content);

    // Remove the block from its current position
    Tree.removeCharacter(parentBlock.content, blockIndex + 1, () => {});
    updateLocalBlock(parentBlock.uuid, parentBlock);

    // Add the block to the new position
    Tree.insertCharacter(
      previousBlock.content,
      newBlockIndex,
      blockToMove.uuid,
      () => {}
    );
    updateLocalBlock(previousBlock.uuid, previousBlock);

    blockToMove.parent = previousBlockExternalId;
  }, [
    blockIndex,
    blockExternalId,
    blocks,
    parentBlock,
    updateBlock,
    updateLocalBlock,
  ]);

  return doTabOperation;
};
