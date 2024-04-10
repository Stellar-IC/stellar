import { Tree } from '@stellar-ic/lseq-ts';
import { parse } from 'uuid';

import { db } from '@/db';
import { PartialBlockEvent } from '@/hooks/documents/useTextBlockKeyboardEventHandlers/types';
import { Block } from '@/types';

import { ExternalId } from '../../../../declarations/workspace/workspace.did';

export class EditorController {
  blockIndex: number;
  block: Block;
  parentBlock: Block;
  parentBlockIndex?: number;
  grandparentBlock?: Block;
  events: PartialBlockEvent[] = [];
  updatedBlocks: { [key: string]: Block } = {};

  constructor(input: {
    blockIndex: number;
    block: Block;
    parentBlock: Block;
    parentBlockIndex?: number;
    grandparentBlock?: Block;
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
    this.updatedBlocks[block.uuid] = block;
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
    if (!this.grandparentBlock) return this;
    if (this.parentBlockIndex === undefined) return this;

    const newBlockIndex = this.parentBlockIndex + 1;

    this._insertContentBlocks(this.grandparentBlock, [
      { index: newBlockIndex, item: this.block.uuid },
    ]);
    this._removeContentBlocks(this.parentBlock, [this.blockIndex]);
    this._updateBlockParent(this.block, this.grandparentBlock.uuid);

    return this;
  };

  moveBlockToPreviousBlock = async () => {
    const previousBlockExternalId = this.parentBlock
      ? Tree.getNodeAtPosition(this.parentBlock.content, this.blockIndex - 1)
          ?.value
      : null;
    const previousBlock = previousBlockExternalId
      ? await db.blocks.get(previousBlockExternalId)
      : null;

    if (!previousBlock) throw new Error('Previous block not found');

    const newBlockIndex = Tree.size(previousBlock.content);

    this._insertContentBlocks(previousBlock, [
      { index: newBlockIndex, item: this.block.uuid },
    ]);
    this._removeContentBlocks(this.parentBlock, [this.blockIndex]);
    this._updateBlockParent(this.block, previousBlock.uuid);

    return this;
  };
}
