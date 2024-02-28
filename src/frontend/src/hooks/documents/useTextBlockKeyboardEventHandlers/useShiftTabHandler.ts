import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback } from 'react';
import { parse } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { Block, ExternalId } from '@/types';

import {
  insertBlockContent as _insertBlockContent,
  removeBlockContent as _removeBlockContent,
  updateBlockParent as _updateBlockParent,
} from './utils';

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
    pages: { updateLocal: updateLocalPage },
    blocks: { updateLocal: updateLocalBlock },
    updateBlock,
  } = usePagesContext();
  const { get } = useDataStoreContext();

  const updateBlockParent = useCallback(
    (block: Block, parentBlock: Block) => {
      _updateBlockParent(block, parentBlock.uuid, {
        onUpdateLocal: (updatedBlock) => {
          updateLocalBlock(updatedBlock.uuid, updatedBlock);
          if ('page' in updatedBlock.blockType) {
            updateLocalPage(updatedBlock.uuid, updatedBlock);
          }
        },
        onUpdateRemote: (updatedBlock) => {
          if (!updatedBlock.parent) throw new Error('No parent');
          updateBlock(parse(updatedBlock.uuid), {
            updateParent: {
              data: {
                blockExternalId: parse(updatedBlock.uuid),
                parentBlockExternalId: parse(updatedBlock.parent),
              },
            },
          });
        },
      });
    },
    [updateBlock, updateLocalBlock, updateLocalPage]
  );

  const insertBlockIntoBlockContent = useCallback(
    (block: Block, newParentBlock: Block, index: number) => {
      _insertBlockContent(newParentBlock, [{ index, item: block.uuid }], {
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
    },
    [updateBlock, updateLocalBlock, updateLocalPage]
  );

  const removeBlockFromParentBlockContent = useCallback(
    (parentBlock: Block, blockIndex: number) => {
      _removeBlockContent(parentBlock, [blockIndex], {
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
    },
    [updateBlock, updateLocalBlock, updateLocalPage]
  );

  const moveSiblingsIntoBlockContent = useCallback(
    (block: Block, siblingBlockExternalIds: ExternalId[]) => {
      const siblings = siblingBlockExternalIds;
      const initialSiblingIndex = Tree.size(block.content);
      let insertIndex = initialSiblingIndex;

      _insertBlockContent(
        block,
        siblings.map((siblingExternalId) => {
          const index = insertIndex;
          insertIndex += 1;
          return {
            index,
            item: siblingExternalId,
          };
        }),
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
    },
    [updateBlock, updateLocalBlock, updateLocalPage]
  );

  const removeSiblingBlocksFromBlockContent = useCallback(
    (parentBlock: Block, siblingBlockExternalIds: ExternalId[]) => {
      _removeBlockContent(
        parentBlock,
        // We are iterating in reverse order so that the indexes don't change
        // as we remove the siblings
        siblingBlockExternalIds.reverse().map((siblingBlockExternalId) => {
          const siblingBlockIndex = Tree.toArray(parentBlock.content).indexOf(
            siblingBlockExternalId
          );
          return siblingBlockIndex;
        }),
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
    },
    [updateBlock, updateLocalBlock, updateLocalPage]
  );

  const updateSiblingBlocksParent = useCallback(
    (block: Block, siblingBlockExternalIds: ExternalId[]) => {
      siblingBlockExternalIds.forEach((siblingBlockExternalId) => {
        const siblingBlock = get<Block>(
          DATA_TYPES.block,
          siblingBlockExternalId
        );

        if (!siblingBlock) return;

        _updateBlockParent(siblingBlock, block.uuid, {
          onUpdateLocal: (updatedBlock) => {
            updateLocalBlock(updatedBlock.uuid, updatedBlock);
            if ('page' in updatedBlock.blockType) {
              updateLocalPage(updatedBlock.uuid, updatedBlock);
            }
          },
          onUpdateRemote: (updatedBlock) => {
            if (!updatedBlock.parent) throw new Error('No parent was set');
            updateBlock(parse(updatedBlock.uuid), {
              updateParent: {
                data: {
                  blockExternalId: parse(updatedBlock.uuid),
                  parentBlockExternalId: parse(updatedBlock.parent),
                },
              },
            });
          },
        });
      });
    },
    [get, updateBlock, updateLocalBlock, updateLocalPage]
  );

  const doShiftTabOperation = useCallback(() => {
    const parentBlock = parentBlockExternalId
      ? get<Block>(DATA_TYPES.page, parentBlockExternalId) ||
        get<Block>(DATA_TYPES.block, parentBlockExternalId)
      : null;

    const grandparentBlock = parentBlock?.parent
      ? get<Block>(DATA_TYPES.page, parentBlock.parent) ||
        get<Block>(DATA_TYPES.block, parentBlock.parent)
      : null;

    if (!parentBlock) return false;
    if (parentBlockIndex === undefined) return false;
    if (!grandparentBlock) return false;

    const blockToMove = get<Block>(DATA_TYPES.block, blockExternalId);
    if (!blockToMove) return false;

    const parentBlockContent = Tree.toArray(parentBlock.content);
    const siblings = parentBlockContent.slice(blockIndex + 1);

    moveSiblingsIntoBlockContent(blockToMove, siblings);
    removeSiblingBlocksFromBlockContent(parentBlock, siblings);
    updateSiblingBlocksParent(blockToMove, siblings);
    updateBlockParent(blockToMove, grandparentBlock);
    insertBlockIntoBlockContent(
      blockToMove,
      grandparentBlock,
      parentBlockIndex + 1
    );
    removeBlockFromParentBlockContent(parentBlock, blockIndex);

    return true;
  }, [
    blockExternalId,
    blockIndex,
    parentBlockExternalId,
    parentBlockIndex,
    get,
    insertBlockIntoBlockContent,
    moveSiblingsIntoBlockContent,
    removeBlockFromParentBlockContent,
    removeSiblingBlocksFromBlockContent,
    updateBlockParent,
    updateSiblingBlocksParent,
  ]);

  return doShiftTabOperation;
};
