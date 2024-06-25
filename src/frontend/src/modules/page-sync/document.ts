import {
  BlockType,
  Time,
  UUID,
  WebSocketMessage,
} from '../../../../declarations/workspace/workspace.did';
import * as Tree from '../lseq/tree';
import { TreeEvent } from '../lseq/types';

import { DocumentSyncProvider } from './types';

type BlockProperty = { text: string } | { boolean: boolean };

type BlockAttributeUpdate =
  | {
      children: TreeEvent;
    }
  | {
      content: TreeEvent;
    }
  | {
      blockType: BlockType;
    }
  | {
      props: [string, BlockProperty][];
    };

type Awareness = {
  username: Text;
  color: Text;
  selection?: {
    start: {
      blockId: BlockId;
      position: bigint;
    };
    end: {
      blockId: BlockId;
      position: bigint;
    };
  };
};

type DocumentStateUpdateId = UUID;

export type DocumentStateUpdate = {
  id: DocumentStateUpdateId;
  time: Time;
  changes: {
    blockId: string;
    data: BlockAttributeUpdate;
  }[];
  awareness?: Awareness;
  userId: string;
};

type BlockId = string;

type DocumentState = {
  id: BlockId;
  // nestedBlocks: [BlockId, DocumentState][];
  // blocks: { [key: BlockId]: DocumentStateBlock };
  updates: DocumentStateUpdate[];
};

type DocumentStateBlock = {
  id: BlockId;
  children: DocumentStateBlock[];
  content: string;
  props: { [key: string]: BlockProperty };
  blockType: BlockType;
};

export class CollaborativeDocument {
  state: DocumentState;
  provider: DocumentSyncProvider;

  constructor(opts: {
    initialState?: DocumentState;
    pageId: BlockId;
    provider: DocumentSyncProvider;
  }) {
    const { pageId } = opts;

    this.state = {
      id: pageId,
      // nestedBlocks: [],
      updates: [],
    };
    this.provider = opts.provider;

    const onClose = () => {};
    const onError = () => {};
    const onMessage = (message: MessageEvent<WebSocketMessage>) => {
      console.log('Message', message);
      if ('syncStep1' in message.data) {
        console.log('Received SyncStep1 message');
        // TODO: Apply diff to page state
        console.log(message.data.syncStep1.updates);
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
      // Send SyncStep1 message with full page state
      this.provider.send({
        syncStep1: {
          pageId,
          updates: [],
          nestedBlocks: [],
        },
      });
    };

    this.provider.on('close', onClose);
    this.provider.on('error', onError);
    this.provider.on('message', onMessage);
    this.provider.on('open', onOpen);
  }

  toObject(): DocumentStateBlock {
    const _buildDefaultStoreBlock = () => ({
      props: {},
      children: new Tree.Tree(),
      content: new Tree.Tree(),
      blockType: { paragraph: null },
    });

    // Build a map of all the blocks in the document
    const blockStore: {
      [key: string]: {
        props: { [key: string]: BlockProperty };
        children: Tree.Tree;
        content: Tree.Tree;
        blockType: BlockType;
      };
    } = {
      [this.state.id]: _buildDefaultStoreBlock(),
    };

    this.state.updates.forEach((update) => {
      update.changes.forEach((change) => {
        const { blockId } = change;

        if (!(blockId in blockStore)) {
          blockStore[blockId] = { ..._buildDefaultStoreBlock() };
        }

        if ('props' in change.data) {
          change.data.props.forEach(([key, value]) => {
            blockStore[blockId].props[key] = value;
          });
        }

        if ('children' in change.data) {
          Tree.applyUpdate(blockStore[blockId].children, change.data.children);

          if ('insert' in change.data.children) {
            const childBlockId = change.data.children.insert.value;
            blockStore[childBlockId] = _buildDefaultStoreBlock();
          }
        }

        if ('content' in change.data) {
          Tree.applyUpdate(blockStore[blockId].content, change.data.content);
        }

        if ('blockType' in change.data) {
          blockStore[blockId].blockType = change.data.blockType;
        }
      });
    });

    function _build(blockId: string): DocumentStateBlock {
      const block = blockStore[blockId];
      const children: DocumentStateBlock[] = [];

      console.log('block', block, blockId);

      Tree.toArray(block.children).forEach((child) => {
        children.push(_build(child));
      });

      const content = Tree.toText(block.content);

      return {
        id: blockId,
        props: block.props,
        children,
        content,
        blockType: block.blockType,
      };
    }

    console.log('Returning _build(this.state.id)');
    return _build(this.state.id);
  }

  // toObject(): {
  //   id: string;
  //   props: { [key: string]: BlockProperty };
  //   children: Tree.Tree;
  //   content: Tree.Tree;
  // } {
  //   const props: { [key: string]: BlockProperty } = {};
  //   const children = new Tree.Tree();
  //   const content = new Tree.Tree();

  //   this.state.updates.forEach((update) => {
  //     update.changes.forEach((change) => {
  //       if ('props' in change.data) {
  //         change.data.props.forEach(([key, value]) => {
  //           props[key] = value;
  //         });
  //       }

  //       if ('children' in change.data) {
  //         Tree.applyUpdate(children, change.data.children);
  //       }

  //       if ('content' in change.data) {
  //         Tree.applyUpdate(content, change.data.content);
  //       }
  //     });
  //   });

  //   return {
  //     id: this.state.id,
  //     props,
  //     children,
  //     content,
  //   };
  // }
}
