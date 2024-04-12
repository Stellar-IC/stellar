import { Node, Tree } from '@stellar-ic/lseq-ts';
import { useCallback } from 'react';
import { parse } from 'uuid';

import { db } from '@/db';
import { store } from '@/modules/data-store';
import { EditorSaveFn } from '@/modules/editor/types';
import { useEditorActions } from '@/modules/editor/hooks/useEditorActions';
import { ExternalId } from '@/types';

import { updateBlockLocal } from '../../modules/editor/hooks/useEditorEventHandlers/utils';

type UseReorderHandler = {
  parentBlockExternalId?: ExternalId | null;
  onSave: EditorSaveFn;
};

export const useReorderHandler = ({
  parentBlockExternalId,
  onSave,
}: UseReorderHandler) => {
  const { updateBlock } = useEditorActions({ onSave });

  const parentBlock = parentBlockExternalId
    ? store.blocks.get(parentBlockExternalId)
    : null;

  const doReorderOperation = useCallback(
    async (
      blockExternalId: ExternalId,
      originalBlockIndex: number,
      updatedBlockIndex: number
    ) => {
      if (!parentBlock) return false;

      const blockToMove = await db.blocks
        .where('uuid')
        .equals(blockExternalId)
        .first();

      if (!blockToMove) return false;

      const node = Tree.getNodeAtPosition(
        parentBlock.content,
        originalBlockIndex
      );

      if (!node) return false;

      // Remove the block from its current position
      updateBlock(parse(parentBlock.uuid), {
        updateContent: {
          blockExternalId: parse(parentBlock.uuid),
          transaction: [
            {
              delete: {
                transactionType: { delete: null },
                position: node.identifier.value,
              },
            },
          ],
        },
      });

      const insertNodeRemote = (node: Node.Node) => {
        // Update the parent block's content to include block at new position
        updateBlock(parse(parentBlock.uuid), {
          updateContent: {
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
      Tree.removeCharacter(parentBlock.content, originalBlockIndex);

      // Add the block to the new position
      Tree.insertCharacter(
        parentBlock.content,
        updatedBlockIndex,
        blockToMove.uuid
      );

      updateBlockLocal(parentBlock);

      return true;
    },
    [parentBlock, updateBlock]
  );

  return doReorderOperation;
};
