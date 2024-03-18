import { Principal } from '@dfinity/principal';
import { Tree } from '@stellar-ic/lseq-ts';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';
import { parse, v4 } from 'uuid';

import { db } from '@/db';
import { Block, ExternalId } from '@/types';

import { BlockEvent } from '../../../../../declarations/workspace/workspace.did';

import { PartialBlockEvent } from './types';

export const updateBlockParent = (
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

export const insertBlockTitleCharacters = (
  block: Block,
  characters: string,
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  const { title } = block.properties;

  characters.split('').forEach((character, index) => {
    const events = Tree.insertCharacter(title, index, character);
    allEvents.push(...events);
  });

  const updatedBlock = {
    ...block,
    properties: {
      ...block.properties,
      title,
    },
  };
  onUpdateLocal(updatedBlock);
  onUpdateRemote(updatedBlock, allEvents);
};

export const removeBlockTitleCharacters = (
  block: Block,
  characterIndexes: number[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  const { title } = block.properties;
  const newTitle = Tree.clone(title);

  characterIndexes.forEach((characterIndex) => {
    const event = Tree.removeCharacter(newTitle, characterIndex - 1);
    if (event) allEvents.push(event);
  });

  const updatedBlock = {
    ...block,
    properties: {
      ...block.properties,
      title: newTitle,
    },
  };
  onUpdateLocal(updatedBlock);
  onUpdateRemote(updatedBlock, allEvents);
};

export const insertBlockContent = (
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
    const events = Tree.insertCharacter(block.content, index, item);
    allEvents.push(...events);
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
};

export const removeBlockContent = (
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
    const event = Tree.removeCharacter(block.content, index);
    if (event) allEvents.push(event);
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
};

export function buildEvent(
  data: PartialBlockEvent,
  userId: Principal
): BlockEvent {
  const now = BigInt(Date.now()) * BigInt(1_000_000); // convert to nanoseconds
  const _build = <DataT>(data: DataT) => ({
    data,
    user: userId,
    uuid: parse(v4()),
    timestamp: now,
  });

  if ('blockCreated' in data) {
    // TODO: Implement blockCreated
  }

  if ('blockUpdated' in data) {
    if ('updatePropertyChecked' in data.blockUpdated) {
      return _build({
        blockUpdated: {
          updatePropertyChecked: {
            ...data.blockUpdated.updatePropertyChecked.data,
          },
        },
      });
    }

    if ('updatePropertyTitle' in data.blockUpdated) {
      return _build({
        blockUpdated: {
          updatePropertyTitle: {
            ...data.blockUpdated.updatePropertyTitle.data,
          },
        },
      });
    }

    if ('updateBlockType' in data.blockUpdated) {
      return _build({
        blockUpdated: {
          updateBlockType: {
            ...data.blockUpdated.updateBlockType.data,
          },
        },
      });
    }

    if ('updateParent' in data.blockUpdated) {
      return _build({
        blockUpdated: {
          updateParent: {
            ...data.blockUpdated.updateParent.data,
          },
        },
      });
    }

    if ('updateContent' in data.blockUpdated) {
      return _build({
        blockUpdated: {
          updateContent: {
            ...data.blockUpdated.updateContent.data,
          },
        },
      });
    }
  }

  throw new Error('Invalid event');
}

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
