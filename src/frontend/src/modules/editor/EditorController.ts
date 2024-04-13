import { Tree } from '@stellar-ic/lseq-ts';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';
import { parse, stringify, v4 } from 'uuid';

import { PartialBlockEvent } from '@/modules/editor/hooks/useEditorEventHandlers/types';
import { Block } from '@/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockParentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  BlockType,
  ExternalId,
  UUID,
} from '../../../../declarations/workspace/workspace.did';
import { store } from '../data-store';

import { EditorSaveFn } from './types';

export class EditorController {
  private _events: PartialBlockEvent[] = [];
  private _updatedBlocks: { [key: string]: Block } = {};
  private _createdBlocks: Block[] = [];
  private _onSave: EditorSaveFn;

  constructor(opts: { onSave: EditorSaveFn }) {
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

    const index = Tree.toArray(grandparentBlock.content).indexOf(block.parent);

    if (index === -1) {
      throw new Error('Parent block not found in grandparent block');
    }

    return index;
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

      this._events.push({
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
    this._updatedBlocks[block.uuid] = block;
  };

  _removeContentBlocks = (block: Block, indexes: number[]) => {
    indexes.forEach((index) => {
      const treeEvent = Tree.removeCharacter(block.content, index);

      if (treeEvent) {
        this._events.push({
          blockUpdated: {
            updateContent: {
              data: {
                blockExternalId: parse(block.uuid),
                transaction: [treeEvent],
              },
            },
          },
        });
        this._updatedBlocks[block.uuid] = block;
      }
    });
  };

  updateBlockParent = (block: Block, parent: ExternalId) => {
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

    this._events.push(event);
    this._updatedBlocks[block.uuid] = block;

    return this;
  };

  updateBlockPropertyChecked(blockExternalId: UUID, checked: boolean) {
    const block = store.blocks.get(stringify(blockExternalId));

    if (!block) {
      throw new Error('Block not found');
    }

    block.properties.checked = checked;

    const event: PartialBlockEvent = {
      blockUpdated: {
        updatePropertyChecked: {
          data: {
            blockExternalId,
            checked,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[block.uuid] = block;

    return this;
  }

  private _updateBlockPropertyTitle(
    blockExternalId: UUID,
    transaction: TreeEvent[]
  ) {
    const block = store.blocks.get(stringify(blockExternalId));

    if (!block) {
      throw new Error('Block not found');
    }

    const event: PartialBlockEvent = {
      blockUpdated: {
        updatePropertyTitle: {
          data: {
            blockExternalId,
            transaction,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[block.uuid] = block;
  }

  updateBlockBlockType(blockExternalId: UUID, blockType: BlockType) {
    const block = store.blocks.get(stringify(blockExternalId));

    if (!block) {
      throw new Error('Block not found');
    }

    block.blockType = blockType;

    const event: PartialBlockEvent = {
      blockUpdated: {
        updateBlockType: {
          data: {
            blockExternalId,
            blockType,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[block.uuid] = block;

    return this;
  }

  updateBlockContent(blockExternalId: UUID, transaction: TreeEvent[]) {
    const block = store.blocks.get(stringify(blockExternalId));

    if (!block) {
      throw new Error('Block not found');
    }

    const event: PartialBlockEvent = {
      blockUpdated: {
        updateContent: {
          data: {
            blockExternalId,
            transaction,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[block.uuid] = block;

    return this;
  }

  adoptSiblingBlocks = (block: Block): void => {
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
      this.updateBlockParent(siblingBlock, block.uuid);
    });
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
    this.updateBlockParent(block, grandparentBlock.uuid);

    return this;
  };

  moveBlockToPreviousBlock = (block: Block) => {
    const parentBlock = this._getParentBlock(block);
    const blockIndex = this._getBlockIndex(block);
    const previousBlock = this._getPrecedingBlock(block);

    if (!previousBlock) return this;

    const newBlockIndex = Tree.size(previousBlock.content);

    this._insertContentBlocks(previousBlock, [
      { index: newBlockIndex, item: block.uuid },
    ]);
    this._removeContentBlocks(parentBlock, [blockIndex]);
    this.updateBlockParent(block, previousBlock.uuid);

    return this;
  };

  save(): Promise<void> {
    return this._onSave({
      updatedBlocks: this._updatedBlocks,
      events: this._events,
    });
  }

  getNewestBlock(): Block {
    const block = this._createdBlocks[this._createdBlocks.length - 1];
    if (!block) throw new Error('No blocks created');
    return block;
  }

  getCreatedBlocks(): Block[] {
    return this._createdBlocks;
  }

  addBlock(parentExternalId: UUID, index: number, blockType: BlockType) {
    const blockExternalId = v4();
    const parentBlock = store.blocks.get(stringify(parentExternalId));

    if (!parentBlock) throw new Error('Parent block not found');

    const block: Block = {
      content: new Tree.Tree(),
      parent: stringify(parentExternalId),
      properties: {
        title: new Tree.Tree(),
        checked: false,
      },
      blockType,
      uuid: blockExternalId,
    };

    const blockCreatedEvent: PartialBlockEvent = {
      blockCreated: {
        data: {
          block: {
            uuid: parse(blockExternalId),
            parent: [parentExternalId],
            blockType,
          },
          index: BigInt(index),
        },
      },
    };
    this._events.push(blockCreatedEvent);
    this._updatedBlocks[block.uuid] = block;
    this._createdBlocks.push(block);

    const contentUpdatedEvent: PartialBlockEvent = {
      blockUpdated: {
        updateContent: {
          data: {
            blockExternalId: parentExternalId,
            transaction: Tree.insertCharacter(
              parentBlock.content,
              index,
              blockExternalId
            ),
          },
        },
      },
    };

    this._events.push(contentUpdatedEvent);
    this._updatedBlocks[parentBlock.uuid] = parentBlock;

    return this;
  }

  removeBlock(parentBlockExternalId: UUID, index: number) {
    const parentId = stringify(parentBlockExternalId);
    const parentBlock = store.blocks.get(parentId);

    if (!parentBlock) {
      throw new Error('Parent block not found');
    }

    const transaction = [Tree.removeCharacter(parentBlock.content, index - 1)];
    const event: PartialBlockEvent = {
      blockUpdated: {
        updateContent: {
          data: {
            blockExternalId: parentBlockExternalId,
            transaction,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[parentBlock.uuid] = parentBlock;

    return this;
  }

  removeBlockTitleCharactersByRange(
    blockExternalId: UUID,
    startPosition: number,
    endPosition: number
  ) {
    const block = store.blocks.get(stringify(blockExternalId));

    if (!block) {
      throw new Error('Block not found');
    }

    // Remove the characters in the range
    // Here, we are building index array in descending order so that we don't
    // have to worry about the index changing as we remove characters
    const characterIndexes = Array.from(
      { length: endPosition - startPosition },
      (_, i) => endPosition - i - 1
    );
    const allEvents: TreeEvent[] = [];

    characterIndexes.forEach((index) => {
      const event = Tree.removeCharacter(block.properties.title, index);
      if (event) allEvents.push(event);
    });

    const updatedBlock = {
      ...block,
      properties: {
        ...block.properties,
        title: Tree.clone(block.properties.title),
      },
    };

    const event: PartialBlockEvent = {
      blockUpdated: {
        updatePropertyTitle: {
          data: {
            blockExternalId,
            transaction: allEvents,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[block.uuid] = updatedBlock;

    return this;
  }

  removeBlockTitleCharactersByIndex(blockExternalId: UUID, indexes: number[]) {
    const block = store.blocks.get(stringify(blockExternalId));

    if (!block) {
      throw new Error('Block not found');
    }

    const allEvents: TreeEvent[] = [];
    const { title } = block.properties;
    const newTitle = Tree.clone(title);

    indexes.forEach((index) => {
      const event = Tree.removeCharacter(newTitle, index);
      if (event) allEvents.push(event);
    });

    const updatedBlock = {
      ...block,
      properties: {
        ...block.properties,
        title: newTitle,
      },
    };
    const event: PartialBlockEvent = {
      blockUpdated: {
        updatePropertyTitle: {
          data: {
            blockExternalId,
            transaction: allEvents,
          },
        },
      },
    };

    this._events.push(event);
    this._updatedBlocks[block.uuid] = updatedBlock;

    return this;
  }

  updateBlock(
    blockExternalId: UUID,
    event:
      | { updateContent: BlockContentUpdatedEventData }
      | { updateBlockType: BlockBlockTypeUpdatedEventData }
      | { updateParent: BlockParentUpdatedEventData }
      | { updatePropertyChecked: BlockPropertyCheckedUpdatedEventData }
      | { updatePropertyTitle: BlockPropertyTitleUpdatedEventData }
  ) {
    if ('updatePropertyChecked' in event) {
      this.updateBlockPropertyChecked(
        blockExternalId,
        event.updatePropertyChecked.checked
      );
    } else if ('updatePropertyTitle' in event) {
      this._updateBlockPropertyTitle(
        blockExternalId,
        event.updatePropertyTitle.transaction
      );
    } else if ('updateBlockType' in event) {
      this.updateBlockBlockType(
        blockExternalId,
        event.updateBlockType.blockType
      );
    } else if ('updateParent' in event) {
      const block = store.blocks.get(stringify(blockExternalId));

      if (!block) {
        throw new Error('Block not found');
      }

      this.updateBlockParent(
        block,
        stringify(event.updateParent.parentBlockExternalId)
      );
    } else if ('updateContent' in event) {
      this.updateBlockContent(blockExternalId, event.updateContent.transaction);
    } else {
      throw new Error('Invalid event');
    }

    return this;
  }
}
