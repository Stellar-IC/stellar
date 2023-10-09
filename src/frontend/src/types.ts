import { Principal } from '@dfinity/principal';
import {
  BlockType,
  Transaction,
  UUID,
} from '../../declarations/documents/documents.did';
import * as Lseq from './modules/lseq';

export type CanisterId = string | Principal;

export type BlockEventType =
  // this event is fired when a block has text added to it.
  | 'insertText'
  // this event is fired when a block has text removed from it.
  | 'deleteText'
  // this event is fired when a block is moved to a page.
  | 'addBlock'
  // this event is fired when a block is removed from the page.
  | 'removeBlock';

export interface AddBlockEvent {
  type: 'addBlock';
  data: { index: number; blockType: BlockType };
}

export interface UpdateBlockEvent {
  type: 'updateBlock';
  data: { blockExternalId: UUID; transactions: Transaction[] };
}

export type RemoveBlockEvent = {
  type: 'removeBlock';
  data: { blockExternalId: UUID };
};

export type BlockEvent = AddBlockEvent | UpdateBlockEvent | RemoveBlockEvent;

export type ExternalId = string;

export type LocalBlockProperties = {
  title: Lseq.Tree.Tree;
  checked?: boolean | null;
};

export type LocalStorageBlock = {
  id: string;
  uuid: ExternalId;
  content: ExternalId[];
  blockType: BlockType;
  properties: {
    title: Lseq.Tree.Tree;
    checked?: boolean | null;
  };
  parent?: ExternalId | null;
};

export type Block = {
  id: string;
  uuid: ExternalId;
  content: ExternalId[];
  blockType: BlockType;
  properties: LocalBlockProperties;
  parent?: ExternalId | null;
};

export type LocalStoragePage = {
  id: string;
  uuid: string;
  content: ExternalId[];
  blockType: BlockType;
  properties: LocalBlockProperties;
  parent?: ExternalId | null;
};

export type Page = {
  id: string;
  uuid: ExternalId;
  content: ExternalId[];
  blockType: BlockType;
  properties: LocalBlockProperties;
  parent?: ExternalId | null;
};
