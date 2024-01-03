import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { Tree } from '@stellar-ic/lseq-ts';
import { Block, ExternalId } from '@/types';
import { useCallback } from 'react';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { DATA_TYPES } from '@/constants';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';

type UseShiftTabHandler = {
  blockIndex: number;
  parentBlockIndex?: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
};

const doUpdateBlockParent = (
  block: Block,
  parent: ExternalId,
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const updatedBlock = {
    ...block,
    parent,
  };
  onUpdateLocal(updatedBlock);
  onUpdateRemote(updatedBlock);
};

const doInsertBlockContent = (
  block: Block,
  data: { index: number; item: ExternalId }[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  data.forEach((x) => {
    const { index, item } = x;
    Tree.insertCharacter(block.content, index, item, (events) => {
      allEvents.push(...events);
    });
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
};

const doRemoveBlockContent = (
  block: Block,
  indexes: number[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  indexes.forEach((index) => {
    // We are removing the character at index + 1 because we want to remove the
    // character before the "cursor"
    Tree.removeCharacter(block.content, index + 1, (event) => {
      allEvents.push(event);
    });
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
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
      doUpdateBlockParent(block, parentBlock.uuid, {
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
      doInsertBlockContent(newParentBlock, [{ index, item: block.uuid }], {
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
      doRemoveBlockContent(parentBlock, [blockIndex], {
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

      doInsertBlockContent(
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
      doRemoveBlockContent(
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

        doUpdateBlockParent(siblingBlock, block.uuid, {
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
