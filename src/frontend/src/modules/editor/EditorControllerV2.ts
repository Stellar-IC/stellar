import { Tree } from '@stellar-ic/lseq-ts';
import { parse } from 'uuid';

import { PartialBlockEvent } from '@/hooks/documents/useTextBlockKeyboardEventHandlers/types';
import { Block } from '@/types';

import { ExternalId } from '../../../../declarations/workspace/workspace.did';
import { store } from '../data-store';

export class EditorControllerV2 {
  events: PartialBlockEvent[] = [];
  updatedBlocks: { [key: string]: Block } = {};

  private _onSave: (data: {
    events: PartialBlockEvent[];
    updatedBlocks: { [key: string]: Block };
  }) => void;

  constructor(opts: {
    onSave: (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => void;
  }) {
    this._onSave = opts.onSave;
  }

  _getSiblingBlocks = (block: Block): Block[] => {
    const parentBlock = this._getParentBlock(block);
    const blockIndex = this._getBlockIndex(block);
    const parentBlockContent = Tree.toArray(parentBlock.content);
    const siblings = parentBlockContent.slice(blockIndex + 1);

    return siblings.map((siblingExternalId) => {
      const siblingBlock = store.blocks.get(siblingExternalId);
      if (!siblingBlock) throw new Error('Sibling block not found');
      return siblingBlock;
    });
  };

  _getParentBlock = (block: Block): Block => {
    if (!block.parent) throw new Error('Block has no parent');

    const parentBlock = store.blocks.get(block.parent);
    if (!parentBlock) throw new Error('Parent block not found');

    return parentBlock;
  };

  _getGrandparentBlock = (block: Block): Block | null => {
    const parentBlock = this._getParentBlock(block);
    if (!parentBlock.parent) return null;

    const grandparentBlock = store.blocks.get(parentBlock.parent);
    if (!grandparentBlock) throw new Error('Grandparent block not found');

    return grandparentBlock;
  };

  _getBlockIndex = (block: Block): number => {
    const parentBlock = this._getParentBlock(block);
    const blockIndex = Tree.toArray(parentBlock.content).indexOf(block.uuid);
    if (blockIndex === -1) throw new Error('Block not found in parent block');

    return blockIndex;
  };

  _getParentBlockIndex = (block: Block): number => {
    if (!block.parent) throw new Error('Block has no parent');

    const grandparentBlock = this._getGrandparentBlock(block);
    if (!grandparentBlock) throw new Error('Block has no grandparent');

    const parentBlockIndex = Tree.toArray(grandparentBlock.content).indexOf(
      block.parent
    );

    if (parentBlockIndex === -1) {
      throw new Error('Parent block not found in grandparent block');
    }

    return parentBlockIndex;
  };

  _getPrecedingBlock = (block: Block): Block | null => {
    const parentBlock = this._getParentBlock(block);
    const blockIndex = this._getBlockIndex(block);

    if (blockIndex === 0) return null;

    const precedingBlockExternalId = Tree.getNodeAtPosition(
      parentBlock.content,
      blockIndex - 1
    )?.value;
    const precedingBlock = precedingBlockExternalId
      ? store.blocks.get(precedingBlockExternalId)
      : null;

    if (!precedingBlock) throw new Error('Preceding block not found');

    return precedingBlock;
  };

  _insertContentBlocks = (
    block: Block,
    data: { index: number; item: ExternalId }[]
  ) => {
    data.forEach((x) => {
      const { index, item } = x;
      const transaction = Tree.insertCharacter(block.content, index, item);

      this.events.push({
        blockUpdated: {
          updateContent: {
            data: {
              blockExternalId: parse(block.uuid),
              transaction,
            },
          },
        },
      });
    });
    this.updatedBlocks[block.uuid] = block;

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
        this.updatedBlocks[block.uuid] = block;
      }
    });
  };

  _updateBlockParent = (block: Block, parent: ExternalId) => {
    // eslint-disable-next-line no-param-reassign
    block.parent = parent;

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
    this.updatedBlocks[block.uuid] = { ...block, parent };
  };

  adoptSiblingBlocks = async (block: Block) => {
    const parentBlock = this._getParentBlock(block);
    const siblingBlocks = this._getSiblingBlocks(block);
    let insertIndex = Tree.size(block.content);

    this._insertContentBlocks(
      block,
      siblingBlocks.map((siblingBlock) => {
        const index = insertIndex;
        insertIndex += 1;
        return {
          index,
          item: siblingBlock.uuid,
        };
      })
    );

    this._removeContentBlocks(
      parentBlock,
      // We are iterating in reverse order so that the indexes don't change
      // as we remove the siblings
      siblingBlocks.reverse().map((siblingBlock) => {
        const siblingBlockIndex = Tree.toArray(parentBlock.content).indexOf(
          siblingBlock.uuid
        );
        return siblingBlockIndex;
      })
    );

    siblingBlocks.forEach((siblingBlock) => {
      if (!siblingBlock) return;
      this._updateBlockParent(siblingBlock, block.uuid);
    });

    return this;
  };

  moveBlockToGrandparent = (block: Block) => {
    const parentBlock = this._getParentBlock(block);
    const blockIndex = this._getBlockIndex(block);
    const grandparentBlock = this._getGrandparentBlock(block);

    if (!grandparentBlock) return this;

    const parentBlockIndex = this._getParentBlockIndex(block);
    const newBlockIndex = parentBlockIndex + 1;

    this._insertContentBlocks(grandparentBlock, [
      { index: newBlockIndex, item: block.uuid },
    ]);
    this._removeContentBlocks(parentBlock, [blockIndex]);
    this._updateBlockParent(block, grandparentBlock.uuid);

    return this;
  };

  moveBlockToPreviousBlock = async (block: Block) => {
    const parentBlock = this._getParentBlock(block);
    const blockIndex = this._getBlockIndex(block);
    const previousBlock = this._getPrecedingBlock(block);

    if (!previousBlock) return this;

    const newBlockIndex = Tree.size(previousBlock.content);

    this._insertContentBlocks(previousBlock, [
      { index: newBlockIndex, item: block.uuid },
    ]);
    this._removeContentBlocks(parentBlock, [blockIndex]);
    this._updateBlockParent(block, previousBlock.uuid);

    return this;
  };

  async save() {
    await this._onSave({
      updatedBlocks: this.updatedBlocks,
      events: this.events,
    });
  }
}
