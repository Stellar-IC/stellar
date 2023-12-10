import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Node, Tree } from '@stellar-ic/lseq-ts';
import { ExternalId } from '@/types';
import { useCallback, useMemo } from 'react';

type UseShiftTabHandler = {
  blockIndex: number;
  parentBlockIndex?: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
};

export const useShiftTabHandler = ({
  blockIndex,
  blockExternalId,
  parentBlockExternalId,
  parentBlockIndex,
}: UseShiftTabHandler) => {
  const {
    pages: { data: pages, updateLocal: updateLocalPage },
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

  const grandparentBlock = useMemo(
    () =>
      parentBlock?.parent
        ? pages[parentBlock.parent] || blocks[parentBlock.parent]
        : null,
    [pages, blocks, parentBlock]
  );

  const doShiftTabOperation = useCallback(() => {
    if (!parentBlock) return false;
    if (!parentBlockIndex) return false;
    if (!grandparentBlock) return false;

    const blockToMove = blocks[blockExternalId];
    if (!blockToMove) return false;

    // Update the block's parent on chain
    updateBlock(parse(blockExternalId), {
      updateParent: {
        data: {
          blockExternalId: parse(blockExternalId),
          parentBlockExternalId: parse(grandparentBlock.uuid),
        },
      },
    });

    const insertNodeRemote = (node: Node.Node) => {
      // Update the grandparent block's content to include the new block
      updateBlock(parse(grandparentBlock.uuid), {
        updateContent: {
          data: {
            blockExternalId: parse(grandparentBlock.uuid),
            transaction: [
              {
                insert: {
                  transactionType: { insert: null },
                  // TODO: This is wrong, we need to insert at the correct position
                  position: node.identifier.value,
                  value: blockToMove.uuid,
                },
              },
            ],
          },
        },
      });
    };

    const newBlockIndex = parentBlockIndex + 1;

    if (newBlockIndex === Tree.size(grandparentBlock.content) - 1) {
      insertNodeRemote(
        Tree.buildNodeForEndInsert(grandparentBlock.content, blockToMove.uuid)
      );
    } else {
      insertNodeRemote(
        Tree.buildNodeForMiddleInsert(
          grandparentBlock.content,
          blockToMove.uuid,
          newBlockIndex
        )
      );
    }

    // Update the parent block's content to remove the block
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

    // Local updates
    // Remove the block from its current position
    Tree.removeCharacter(parentBlock.content, blockIndex + 1, () => {});
    updateLocalBlock(parentBlock.uuid, parentBlock);
    if ('page' in parentBlock.blockType) {
      updateLocalPage(blockToMove.uuid, blockToMove);
    }

    // Add the block to the new position
    Tree.insertCharacter(
      grandparentBlock.content,
      newBlockIndex,
      blockToMove.uuid,
      () => {}
    );
    updateLocalBlock(grandparentBlock.uuid, grandparentBlock);
    if ('page' in grandparentBlock.blockType) {
      updateLocalPage(grandparentBlock.uuid, grandparentBlock);
    }

    blockToMove.parent = grandparentBlock.uuid;
    updateLocalBlock(blockToMove.uuid, blockToMove);
  }, [
    blockIndex,
    blockExternalId,
    blocks,
    grandparentBlock,
    parentBlock,
    parentBlockIndex,
    updateBlock,
    updateLocalBlock,
    updateLocalPage,
  ]);

  return doShiftTabOperation;
};
