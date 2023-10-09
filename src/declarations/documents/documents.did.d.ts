import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddBlockUpdateInput {
  content: BlockContent__1;
  uuid: UUID;
  blockType: BlockType__1;
  properties: ShareableBlockProperties__1;
  parent: [] | [UUID];
}
export type AddBlockUpdateOutput =
  | { ok: AddBlockUpdateOutputResult }
  | { err: AddBlockUpdateOutputError };
export type AddBlockUpdateOutputError = null;
export interface AddBlockUpdateOutputResult {
  id: PrimaryKey__1;
}
export type AllocationStrategy =
  | { boundaryPlus: null }
  | { boundaryMinus: null };
export type BlockContent = Array<UUID>;
export type BlockContent__1 = Array<UUID>;
export type BlockType =
  | { heading1: null }
  | { heading2: null }
  | { heading3: null }
  | { page: null }
  | { paragraph: null };
export type BlockType__1 =
  | { heading1: null }
  | { heading2: null }
  | { heading3: null }
  | { page: null }
  | { paragraph: null };
export interface CreatePageUpdateInput {
  content: BlockContent__1;
  uuid: UUID;
  properties: ShareableBlockProperties__1;
  parent: [] | [UUID];
}
export type CreatePageUpdateOutput =
  | { ok: CreatePageUpdateOutputResult }
  | { err: CreatePageUpdateOutputError };
export type CreatePageUpdateOutputError =
  | { failedToCreate: null }
  | { anonymousUser: null }
  | { invalidBlockType: null }
  | { insufficientCycles: null }
  | { inputTooLong: null };
export interface CreatePageUpdateOutputResult {
  id: PrimaryKey;
  content: BlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export interface Edge {
  node: ShareablePage;
}
export type NodeBase = number;
export type NodeBoundary = number;
export type NodeDepth = number;
export type NodeIdentifier = Uint16Array | number[];
export type NodeIndex = number;
export type NodeValue = string;
export interface PaginatedResults {
  edges: Array<Edge>;
}
export type PrimaryKey = bigint;
export type PrimaryKey__1 = bigint;
export type Result = { ok: ShareablePage } | { err: { pageNotFound: null } };
export type Result_1 =
  | { ok: ShareableBlock }
  | { err: { blockNotFound: null } };
export type SaveEventUpdateInput =
  | {
      blockRemoved: {
        payload: { blockExternalId: UUID; parent: UUID };
        eventType: { blockRemoved: null };
      };
    }
  | {
      blockCreated: {
        payload: SaveEventUpdateInputPayload;
        eventType: { blockCreated: null };
      };
    }
  | {
      blockTypeChanged: {
        payload: { blockType: BlockType__1; blockExternalId: UUID };
        eventType: { blockTypeChanged: null };
      };
    }
  | {
      blockUpdated: {
        payload: {
          transactions: Array<Transaction>;
          blockExternalId: UUID;
        };
        eventType: { blockUpdated: null };
      };
    };
export interface SaveEventUpdateInputPayload {
  block: {
    content: BlockContent__1;
    uuid: UUID;
    blockType: BlockType__1;
    properties: ShareableBlockProperties__1;
    parent: [] | [UUID];
  };
  index: bigint;
}
export type SaveEventUpdateOutput =
  | { ok: SaveEventUpdateOutputResult }
  | { err: SaveEventUpdateOutputError };
export type SaveEventUpdateOutputError =
  | { anonymousUser: null }
  | { insufficientCycles: null };
export type SaveEventUpdateOutputResult = null;
export interface ShareableBlock {
  id: PrimaryKey;
  content: BlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export interface ShareableBlockProperties {
  title: [] | [ShareableBlockText];
  checked: [] | [boolean];
}
export interface ShareableBlockProperties__1 {
  title: [] | [ShareableBlockText];
  checked: [] | [boolean];
}
export interface ShareableBlockText {
  boundary: NodeBoundary;
  allocationStrategies: Array<[NodeDepth, AllocationStrategy]>;
  rootNode: ShareableNode;
}
export interface ShareableNode {
  value: NodeValue;
  base: NodeBase;
  children: Array<[NodeIndex, ShareableNode]>;
  identifier: NodeIdentifier;
  deletedAt: [] | [Time];
}
export interface ShareablePage {
  id: PrimaryKey;
  content: BlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export type SortDirection = { asc: null } | { desc: null };
export interface SortOrder {
  direction: SortDirection;
  fieldName: string;
}
export type Time = bigint;
export type Transaction =
  | {
      delete: {
        transactionType: { delete: null };
        position: NodeIdentifier;
      };
    }
  | {
      insert: {
        transactionType: { insert: null };
        value: NodeValue;
        position: NodeIdentifier;
      };
    };
export type UUID = Uint8Array | number[];
export interface UpdateBlockUpdateInput {
  id: PrimaryKey;
  content: BlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export type UpdateBlockUpdateOutput =
  | { ok: UpdateBlockUpdateOutputResult }
  | { err: UpdateBlockUpdateOutputError };
export type UpdateBlockUpdateOutputError = { primaryKeyAttrNotFound: null };
export interface UpdateBlockUpdateOutputResult {
  id: PrimaryKey;
  content: BlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export interface _SERVICE {
  addBlock: ActorMethod<[AddBlockUpdateInput], AddBlockUpdateOutput>;
  blockByUuid: ActorMethod<[UUID], Result_1>;
  createPage: ActorMethod<[CreatePageUpdateInput], CreatePageUpdateOutput>;
  page: ActorMethod<[PrimaryKey__1], Result>;
  pageByUuid: ActorMethod<[UUID], Result>;
  pages: ActorMethod<
    [
      {
        order: [] | [SortOrder];
        cursor: [] | [PrimaryKey__1];
        limit: [] | [bigint];
      }
    ],
    PaginatedResults
  >;
  saveEvent: ActorMethod<[SaveEventUpdateInput], SaveEventUpdateOutput>;
  updateBlock: ActorMethod<[UpdateBlockUpdateInput], UpdateBlockUpdateOutput>;
}
