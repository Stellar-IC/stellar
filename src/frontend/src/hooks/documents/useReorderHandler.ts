import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Node, Tree } from '@stellar-ic/lseq-ts';
import { ExternalId } from '@/types';
import { useCallback, useMemo } from 'react';

type UseReorderHandler = {
  parentBlockExternalId?: ExternalId | null;
};

export const useReorderHandler = ({
  parentBlockExternalId,
}: UseReorderHandler) => {
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

  const doReorderOperation = useCallback(
    (
      blockExternalId: ExternalId,
      originalBlockIndex: number,
      updatedBlockIndex: number
    ) => {
      if (!parentBlock) return false;

      const blockToMove = blocks[blockExternalId];
      if (!blockToMove) return false;

      // Remove the block from its current position
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
                    originalBlockIndex
                  ).identifier.value,
                },
              },
            ],
          },
        },
      });

      const insertNodeRemote = (node: Node.Node) => {
        // Update the parent block's content to include block at new position
        updateBlock(parse(parentBlock.uuid), {
          updateContent: {
            data: {
              blockExternalId: parse(parentBlock.uuid),
              transaction: [
                {
                  insert: {
                    transactionType: { insert: null },
                    // TODO: Fix me - The block may not have been moved to the middle of the parent block's content
                    position: node.identifier.value,
                    value: blockToMove.uuid,
                  },
                },
              ],
            },
          },
        });
      };

      if (updatedBlockIndex === 0) {
        const nodes = Tree.buildNodesForFrontInsert(
          parentBlock.content,
          blockToMove.uuid
        );

        if (nodes.nodeToDelete) {
          updateBlock(parse(parentBlock.uuid), {
            updateContent: {
              data: {
                blockExternalId: parse(parentBlock.uuid),
                transaction: [
                  {
                    delete: {
                      transactionType: { delete: null },
                      position: nodes.nodeToDelete.identifier.value,
                    },
                  },
                ],
              },
            },
          });
        }

        insertNodeRemote(nodes.node);

        if (nodes.replacementNode) {
          insertNodeRemote(nodes.replacementNode);
        }
      } else if (updatedBlockIndex === Tree.size(parentBlock.content) - 1) {
        insertNodeRemote(
          Tree.buildNodeForEndInsert(parentBlock.content, blockToMove.uuid)
        );
      } else {
        insertNodeRemote(
          Tree.buildNodeForMiddleInsert(
            parentBlock.content,
            blockToMove.uuid,
            updatedBlockIndex + 1
          )
        );
      }

      // Local updates
      // Remove the block from its current position
      Tree.removeCharacter(
        parentBlock.content,
        originalBlockIndex + 1,
        () => {}
      );

      // Add the block to the new position
      Tree.insertCharacter(
        parentBlock.content,
        updatedBlockIndex,
        blockToMove.uuid,
        () => {}
      );

      updateLocalBlock(parentBlock.uuid, parentBlock);

      if ('page' in parentBlock.blockType) {
        updateLocalPage(parentBlock.uuid, parentBlock);
      }
    },
    [blocks, parentBlock, updateBlock, updateLocalBlock, updateLocalPage]
  );

  return doReorderOperation;
};
