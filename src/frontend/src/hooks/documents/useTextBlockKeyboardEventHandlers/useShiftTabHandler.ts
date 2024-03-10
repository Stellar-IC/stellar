import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback } from 'react';
import { parse } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useSaveEvents } from '@/hooks/canisters/workspace/updates/useSaveEvents';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { focusBlock } from '@/modules/editor/utils';
import { Block, ExternalId } from '@/types';

import { PartialBlockEvent } from './types';
import { buildEvent } from './utils';

type UseShiftTabHandler = {
  blockIndex: number;
  parentBlockIndex?: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
};

class OperationHandler {
  blockIndex: number;
  block: Block;
  parentBlock: Block;
  parentBlockIndex: number;
  grandparentBlock: Block;
  events: PartialBlockEvent[] = [];

  constructor(input: {
    blockIndex: number;
    block: Block;
    parentBlock: Block;
    parentBlockIndex: number;
    grandparentBlock: Block;
  }) {
    const {
      blockIndex,
      block,
      parentBlock,
      parentBlockIndex,
      grandparentBlock,
    } = input;
    this.blockIndex = blockIndex;
    this.block = block;
    this.parentBlock = parentBlock;
    this.parentBlockIndex = parentBlockIndex;
    this.grandparentBlock = grandparentBlock;
  }

  _insertContentBlocks = (
    block: Block,
    data: { index: number; item: ExternalId }[]
  ) => {
    data.forEach((x) => {
      const { index, item } = x;
      const treeEvents = Tree.insertCharacter(block.content, index, item);

      this.events.push({
        blockUpdated: {
          updateContent: {
            data: {
              blockExternalId: parse(block.uuid),
              transaction: treeEvents,
            },
          },
        },
      });
    });

    return this;
  };

  _removeContentBlocks = (block: Block, indexes: number[]) => {
    indexes.forEach((index) => {
      const treeEvent = Tree.removeCharacter(block.content, index);

      if (treeEvent) {
        this.events.push({
          blockUpdated: {
            updateContent: {
              data: {
                blockExternalId: parse(block.uuid),
                transaction: [treeEvent],
              },
            },
          },
        });
      }
    });
  };

  _updateBlockParent = (block: Block, parent: ExternalId) => {
    this.block.parent = parent;

    const event = {
      blockUpdated: {
        updateParent: {
          data: {
            blockExternalId: parse(block.uuid),
            parentBlockExternalId: parse(parent),
          },
        },
      },
    };

    this.events.push(event);
  };

  adoptSiblingBlocks = async () => {
    const parentBlockContent = Tree.toArray(this.parentBlock.content);
    const siblings = parentBlockContent.slice(this.blockIndex + 1);
    const siblingBlocks = await db.blocks.bulkGet(siblings);
    let insertIndex = Tree.size(this.block.content);

    this._insertContentBlocks(
      this.block,
      siblings.map((siblingExternalId) => {
        const index = insertIndex;
        insertIndex += 1;
        return {
          index,
          item: siblingExternalId,
        };
      })
    );

    this._removeContentBlocks(
      this.parentBlock,
      // We are iterating in reverse order so that the indexes don't change
      // as we remove the siblings
      siblings.reverse().map((siblingBlockExternalId) => {
        const siblingBlockIndex = Tree.toArray(
          this.parentBlock.content
        ).indexOf(siblingBlockExternalId);
        return siblingBlockIndex;
      })
    );

    siblingBlocks.forEach((siblingBlock) => {
      if (!siblingBlock) return;
      this._updateBlockParent(siblingBlock, this.block.uuid);
    });

    return this;
  };

  moveBlockToGrandparent = () => {
    this._insertContentBlocks(this.grandparentBlock, [
      { index: this.parentBlockIndex + 1, item: this.block.uuid },
    ]);
    this._removeContentBlocks(this.parentBlock, [this.blockIndex]);
    this._updateBlockParent(this.block, this.grandparentBlock.uuid);
  };
}

export const useShiftTabHandler = ({
  blockIndex,
  blockExternalId,
  parentBlockExternalId,
  parentBlockIndex,
}: UseShiftTabHandler) => {
  const { workspaceId } = useWorkspaceContext();
  const { identity, userId } = useAuthContext();

  const [saveEvents] = useSaveEvents({
    identity,
    workspaceId,
  });

  const doShiftTabOperation = useCallback(async () => {
    const parentBlock = parentBlockExternalId
      ? await db.blocks.get(parentBlockExternalId)
      : null;

    const grandparentBlock = parentBlock?.parent
      ? await db.blocks.get(parentBlock.parent)
      : null;

    if (!parentBlock) return false;
    if (parentBlockIndex === undefined) return false;
    if (!grandparentBlock) return false;

    const blockToMove = await db.blocks.get(blockExternalId);

    if (!blockToMove) return false;

    // const parentBlockContent = Tree.toArray(parentBlock.content);
    // const siblings = parentBlockContent.slice(blockIndex + 1);

    const x = new OperationHandler({
      blockIndex,
      block: blockToMove,
      parentBlock,
      parentBlockIndex,
      grandparentBlock,
    });
    await x.adoptSiblingBlocks();
    await x.moveBlockToGrandparent();

    const {
      block: updatedBlock,
      parentBlock: updatedParentBlock,
      grandparentBlock: updatedGrandparentBlock,
      events,
    } = x;

    await db.blocks.bulkPut([
      updatedBlock,
      updatedParentBlock,
      updatedGrandparentBlock,
    ]);

    await saveEvents({
      transaction: events.map((x) => buildEvent(x, userId)),
    });

    setTimeout(() => {
      focusBlock(blockToMove.uuid);
    }, 400);

    return true;
  }, [
    blockExternalId,
    blockIndex,
    userId,
    parentBlockExternalId,
    parentBlockIndex,
    saveEvents,
  ]);

  return doShiftTabOperation;
};
