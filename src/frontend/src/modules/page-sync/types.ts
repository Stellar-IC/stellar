import { Time } from '@/types';

import {
  BlockType,
  WebSocketMessage,
} from '../../../../declarations/workspace/workspace.did';
import { Tree } from '../lseq';
import { TreeEvent } from '../lseq/types';

export type DocumentSyncProviderEvent = 'open' | 'close' | 'message' | 'error';
export type DocumentSyncProvider = {
  send: (message: WebSocketMessage) => void;
  on: {
    (
      event: 'message',
      listener: (message: MessageEvent<WebSocketMessage>) => void
    ): void;
    (event: 'open', listener: () => void): void;
    (event: 'close', listener: () => void): void;
    (event: 'error', listener: (error: any) => void): void;
  };
};

export type BlockProperty = { text: string } | { boolean: boolean };

export type BlockAttributeUpdate =
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

export type Awareness = {
  username: string;
  color: string;
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

export type DocumentUpdateId = string;

export type BlockChange = {
  blockId: string;
  data: BlockAttributeUpdate;
};

export type PartialDocumentUpdate = {
  time: Time;
  changes: BlockChange[];
};

export type DocumentUpdate = {
  id: DocumentUpdateId;
  time: Time;
  changes: BlockChange[];
  awareness?: Awareness;
  userId: string;
};

export type BlockId = string;
export type UserId = string;

export type Document = {
  id: BlockId;
  updates: DocumentUpdate[];
};

export type BlockParentType =
  | {
      block: null;
    }
  | {
      workspace: null;
    };

export type DocumentBlock = {
  id: BlockId;
  blockType: BlockType;
  children: DocumentBlock[];
  content: string;
  props: { [key: string]: BlockProperty };
};

export type BlockStoreBlock = {
  id: BlockId;
  blockType: BlockType;
  children: Tree.Tree;
  content: Tree.Tree;
  props: { [key: string]: BlockProperty };
  parent: { id: string; type: BlockParentType };
};
