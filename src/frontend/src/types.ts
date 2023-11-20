import { Principal } from '@dfinity/principal';
import { BlockType } from '../../declarations/workspace/workspace.did';
import * as Lseq from './modules/lseq';

export type CanisterId = string | Principal;

export type ExternalId = string;

export type LocalBlockProperties = {
  title: Lseq.Tree.Tree;
  checked?: boolean | null;
};

export type LocalStorageBlock = {
  id: string;
  uuid: ExternalId;
  content: Lseq.Tree.Tree;
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
  content: Lseq.Tree.Tree;
  blockType: BlockType;
  properties: LocalBlockProperties;
  parent?: ExternalId | null;
};

export type LocalStoragePage = {
  id: string;
  uuid: string;
  content: Lseq.Tree.Tree;
  blockType: BlockType;
  properties: LocalBlockProperties;
  parent?: ExternalId | null;
};

export type Page = {
  id: string;
  uuid: ExternalId;
  content: Lseq.Tree.Tree;
  blockType: BlockType;
  properties: LocalBlockProperties;
  parent?: ExternalId | null;
};
