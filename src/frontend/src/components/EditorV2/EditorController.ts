import { v4 } from 'uuid';

import { Tree } from '@/modules/lseq';
import { TreeEvent } from '@/modules/lseq/types';
import { CollaborativeDocument } from '@/modules/page-sync/document';
import {
  BlockStoreBlock,
  PartialDocumentUpdate,
} from '@/modules/page-sync/types';

import { BlockType } from '../../../../declarations/workspace/workspace.did';

type Block = BlockStoreBlock;
type BlockId = string;

type EditorSaveFn = (
  doc: CollaborativeDocument,
  data: {
    events: PartialDocumentUpdate[];
  }
) => Promise<void>;

export class EditorController {
  private _events: PartialDocumentUpdate[] = [];
  private _onSave: EditorSaveFn;
  private _focusedBlockId: BlockId | null = null;
  doc: CollaborativeDocument;

  constructor(doc: CollaborativeDocument, opts: { onSave: EditorSaveFn }) {
    this._onSave = opts.onSave;
    this.doc = doc;
  }

  addBlock(parentExternalId: BlockId, position: number, blockType?: BlockType) {
    const parentBlock = this._getBlock(parentExternalId);
    const { children } = parentBlock;
    const idForNewBlock = v4();
    const events = Tree.buildInsertEvents(children, position, idForNewBlock);
    const update: PartialDocumentUpdate = {
      changes: this._buildContentChangesetFromTreeEvents(
        parentExternalId,
        events
      ),
      time: BigInt(Date.now()),
    };
    this._events.push(update);

    if (blockType) {
      this._events.push(this._buildBlockTypeUpdate(idForNewBlock, blockType));
    }

    return this;
  }

  canNest() {
    // A block can be nested if its parent is a block and it has a sibling before it
    if (!this._focusedBlockId) return false;

    const block = this._getBlock(this._focusedBlockId);

    if (!('block' in block.parent.type)) return false;

    const { children } = this._getBlock(block.parent.id);
    const index = Tree.toArray(children).indexOf(block.id);

    return index > 0;
  }

  canUnnest() {
    // A block can be unnested if its parent is a block
    // that is not the root
    if (!this._focusedBlockId) return false;

    const block = this._getBlock(this._focusedBlockId);
    if (!('block' in block.parent.type)) return false;

    const parent = this._getBlock(block.parent.id);
    if (!('block' in parent.parent.type)) return false;

    return true;
  }

  deleteContent(blockExternalId: BlockId, position: number) {
    const block = this._getBlock(blockExternalId);
    const event = Tree.buildDeleteEvent(block.content, position);
    const update: PartialDocumentUpdate = {
      changes: this._buildContentChangesetFromTreeEvents(blockExternalId, [
        event,
      ]),
      time: BigInt(Date.now()),
    };

    this._events.push(update);

    return this;
  }

  insertContent(blockId: BlockId, position: number, value: string) {
    const block = this._getBlock(blockId);
    const events = Tree.buildInsertEvents(block.content, position, value);
    const update: PartialDocumentUpdate = {
      changes: this._buildContentChangesetFromTreeEvents(blockId, events),
      time: BigInt(Date.now()),
    };

    this._events.push(update);

    return this;
  }

  nest(): EditorController {
    if (!this._focusedBlockId) return this;
    if (!this.canNest()) return this;

    const block = this._getBlock(this._focusedBlockId);
    const parentBlock = this._getBlock(block.parent.id);
    const children = Tree.toArray(parentBlock.children);
    const index = children.indexOf(block.id);
    const siblingBefore = this._getBlock(children[index - 1]);

    // Insert the block into the sibling before
    const events = Tree.buildInsertEvents(
      siblingBefore.children,
      Tree.toArray(siblingBefore.children).length,
      block.id
    );
    const update: PartialDocumentUpdate = {
      changes: this._buildChildrenChangesetFromTreeEvents(
        siblingBefore.id,
        events
      ),
      time: BigInt(Date.now()),
    };

    // Remove the block from the parent
    const parentEvent = Tree.buildDeleteEvent(parentBlock.children, index);
    const parentUpdate: PartialDocumentUpdate = {
      changes: this._buildChildrenChangesetFromTreeEvents(parentBlock.id, [
        parentEvent,
      ]),
      time: BigInt(Date.now()),
    };
    const updates = [update, parentUpdate];

    this._events.push(...updates);

    return this;
  }

  reset() {
    this._events = [];
  }

  save(shouldReset = true): Promise<void> {
    this.doc.applyPartialUpdates(this._events);
    this.doc.save();

    return this._onSave(this.doc, {
      events: this._events,
    }).then(() => {
      if (shouldReset) this.reset();
    });
  }

  setFocusedBlock(blockId: BlockId | null) {
    this._focusedBlockId = blockId;
  }

  unnest(): EditorController {
    if (!this._focusedBlockId) return this;
    if (!this.canUnnest()) return this;

    const now = BigInt(Date.now());
    const block = this._getBlock(this._focusedBlockId);
    const parentBlock = this._getBlock(block.parent.id);

    // Insert the block into the parent's parent
    const grandparentBlock = this._getBlock(parentBlock.parent.id);
    const childrenOfGrandparent = Tree.toArray(grandparentBlock.children);
    const parentBlockIndex = childrenOfGrandparent.indexOf(parentBlock.id);
    const newIndex = parentBlockIndex + 1;
    const events = Tree.buildInsertEvents(
      grandparentBlock.children,
      newIndex,
      block.id
    );
    const update: PartialDocumentUpdate = {
      changes: this._buildChildrenChangesetFromTreeEvents(
        grandparentBlock.id,
        events
      ),
      time: now,
    };

    // Remove the block from the parent
    const siblings = Tree.toArray(parentBlock.children);
    const index = siblings.indexOf(block.id);
    const parentEvent = Tree.buildDeleteEvent(parentBlock.children, index);
    const parentUpdate: PartialDocumentUpdate = {
      changes: this._buildChildrenChangesetFromTreeEvents(parentBlock.id, [
        parentEvent,
      ]),
      time: now,
    };
    const updates = [update, parentUpdate];

    this._events.push(...updates);

    return this;
  }

  updateBlockType(blockId: BlockId, blockType: BlockType) {
    const block = this._getBlock(blockId);
    block.blockType = blockType;
    this._events.push(this._buildBlockTypeUpdate(blockId, blockType));

    return this;
  }

  // Private methods

  _getBlock(blockId: BlockId): Block {
    const block = this.doc.blockStore[blockId];
    if (!block) throw new Error('Block not found');
    return block;
  }

  _getTopLevelBlocks(): Block[] {
    const topLevelBlocks: Block[] = [];
    Object.values(this.doc.blockStore).forEach((block) => {
      if (!('block' in block.parent.type)) {
        topLevelBlocks.push(block);
      }
    });
    return topLevelBlocks;
  }

  _buildContentChangesetFromTreeEvents(
    blockId: BlockId,
    events: TreeEvent[]
  ): PartialDocumentUpdate['changes'] {
    return events.map((event) => ({
      blockId,
      data: { content: event },
    }));
  }

  _buildChildrenChangesetFromTreeEvents(
    blockId: BlockId,
    events: TreeEvent[]
  ): PartialDocumentUpdate['changes'] {
    return events.map((event) => ({
      blockId,
      data: { children: event },
    }));
  }

  _buildBlockTypeUpdate(
    blockId: string,
    blockType: BlockType
  ): PartialDocumentUpdate {
    return {
      changes: [
        {
          blockId,
          data: { blockType },
        },
      ],
      time: BigInt(Date.now()),
    };
  }
}
