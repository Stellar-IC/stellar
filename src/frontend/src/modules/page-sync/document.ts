import { v4 } from 'uuid';

import {
  Awareness,
  WebSocketMessage,
} from '../../../../declarations/workspace/workspace.did';
import * as Tree from '../lseq/tree';

import {
  BlockId,
  BlockParentType,
  BlockStoreBlock,
  Document,
  DocumentBlock,
  DocumentSyncProvider,
  DocumentUpdate,
  PartialDocumentUpdate,
  UserId,
} from './types';

export class CollaborativeDocument {
  state: Document;
  userId: UserId;
  provider: DocumentSyncProvider;
  blockStore: {
    [key: string]: BlockStoreBlock;
  };
  listeners: {
    change: (() => void)[];
  } = {
    change: [],
  };

  constructor(opts: {
    initialState?: Document;
    userId: UserId;
    page: {
      id: BlockId;
      parent: {
        id: BlockId;
        type: BlockParentType;
      };
    };
    provider: DocumentSyncProvider;
  }) {
    const { initialState, page, userId } = opts;
    const pageId = page.id;

    if (initialState && initialState.id !== pageId) {
      throw new Error('id in initialState should match the page id');
    }

    this.state = {
      id: pageId,
      updates: initialState?.updates || [],
    };
    this.userId = userId;
    this.provider = opts.provider;
    this.blockStore = {
      [pageId]: this._buildDefaultStoreBlock(pageId, page.parent),
    };
    this._saveUpdatesToStore(this.state.updates);

    const onClose = () => {};
    const onError = () => {};
    const onMessage = (message: MessageEvent<WebSocketMessage>) => {
      if ('syncStep1' in message.data) {
        console.log('Received SyncStep1 message');
        // TODO: Apply diff to page state
        console.log(message.data.syncStep1);
      }

      if ('syncStep2' in message.data) {
        console.log('Received SyncStep2 message');
        // TODO: Apply diff to page state
        console.log(message.data.syncStep2);

        return;
      }

      if ('syncDone' in message.data) {
        console.log('Received SyncDone message');
        // TODO: update last sync time
      }
    };
    const onOpen = () => {
      console.log('Sending SyncStep1 message');
      console.log(this._buildSyncStep1Message());
      // Send SyncStep1 message with full page state
      this.provider.send({
        syncStep1: this._buildSyncStep1Message(),
      });
    };

    this.provider.on('close', onClose);
    this.provider.on('error', onError);
    this.provider.on('message', onMessage);
    this.provider.on('open', onOpen);
  }

  applyPartialUpdates(updates: PartialDocumentUpdate[]): CollaborativeDocument {
    const fullUpdates: DocumentUpdate[] = updates.map((update) => ({
      id: v4(),
      userId: this.userId,
      ...update,
    }));
    this.state.updates.push(...fullUpdates);
    this._saveUpdatesToStore(fullUpdates);
    this._broadcastChange();

    return this;
  }

  applyUpdates(updates: DocumentUpdate[]): CollaborativeDocument {
    this.state.updates.push(...updates);
    this._saveUpdatesToStore(updates);
    this._broadcastChange();

    return this;
  }

  on(event: 'change', cb: () => void) {
    this.listeners[event].push(cb);
  }

  off(event: 'change', cb: () => void) {
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== cb
    );
  }

  save() {
    this.provider.send({
      syncStep1: this._buildSyncStep1Message(),
    });
  }

  // Build a map of all the blocks in the document
  toJson(this: CollaborativeDocument): DocumentBlock {
    const _build = (blockId: string): DocumentBlock => {
      const block = this.blockStore[blockId];
      const children: DocumentBlock[] = [];

      Tree.toArray(block.children).forEach((child) => {
        children.push(_build(child));
      });

      return {
        id: blockId,
        props: block.props,
        children,
        content: Tree.toText(block.content),
        blockType: block.blockType,
      };
    };

    return _build(this.state.id);
  }

  _buildDefaultStoreBlock = (
    blockId: BlockId,
    parent: {
      id: BlockId;
      type: BlockParentType;
    }
  ): BlockStoreBlock => ({
    id: blockId,
    props: {},
    children: new Tree.Tree(),
    content: new Tree.Tree(),
    blockType: { paragraph: null },
    parent,
  });

  _saveUpdateToStore = (update: DocumentUpdate) => {
    update.changes.forEach((change) => {
      const { blockId } = change;

      if (!(blockId in this.blockStore)) {
        this.blockStore[blockId] = {
          ...this._buildDefaultStoreBlock(blockId, {
            id: this.state.id,
            type: { block: null },
          }),
        };
      }

      if ('props' in change.data) {
        change.data.props.forEach(([key, value]) => {
          this.blockStore[blockId].props[key] = value;
        });
      }

      if ('children' in change.data) {
        Tree.applyUpdate(
          this.blockStore[blockId].children,
          change.data.children
        );

        if ('insert' in change.data.children) {
          const parentBlockId = blockId;
          const childBlockId = change.data.children.insert.value;

          // If the child block is not in the store, add it
          if (!(childBlockId in this.blockStore)) {
            this.blockStore[childBlockId] = this._buildDefaultStoreBlock(
              childBlockId,
              {
                id: parentBlockId,
                type: { block: null },
              }
            );
          } else {
            // If the child block is in the store, update its parent
            this.blockStore[childBlockId].parent = {
              id: parentBlockId,
              type: { block: null },
            };
          }
        }
      }

      if ('content' in change.data) {
        Tree.applyUpdate(this.blockStore[blockId].content, change.data.content);
      }

      if ('blockType' in change.data) {
        this.blockStore[blockId].blockType = change.data.blockType;
      }
    });
  };

  _saveUpdatesToStore = (updates: DocumentUpdate[]) => {
    updates.forEach((update) => {
      this._saveUpdateToStore(update);
    });
  };

  _buildSyncStep1Message = () => ({
    id: this.state.id,
    updates: this.state.updates.map((update) => {
      const awareness: [] | [Awareness] = update.awareness
        ? [
            {
              ...update.awareness,
              selection: update.awareness.selection
                ? [{ ...update.awareness.selection }]
                : [],
            },
          ]
        : [];

      return {
        ...update,
        awareness,
      };
    }),
  });

  _broadcastChange() {
    this.listeners.change.forEach((listener) => listener());
  }
}
