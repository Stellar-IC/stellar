import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddBlockUpdateInput {
  content: BlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export type AddBlockUpdateOutput =
  | { ok: AddBlockUpdateOutputResult }
  | { err: AddBlockUpdateOutputError };
export type AddBlockUpdateOutputError = null;
export interface AddBlockUpdateOutputResult {
  id: PrimaryKey__2;
}
export type AllocationStrategy =
  | { boundaryPlus: null }
  | { boundaryMinus: null };
export type BlockContent = Array<UUID>;
export type BlockType =
  | { heading1: null }
  | { heading2: null }
  | { heading3: null }
  | { page: null }
  | { paragraph: null };
export type BlockUpdatedEventTransaction =
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
export interface CreatePageUpdateInput {
  content: BlockContent;
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
  node: ShareableBlock;
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
export type PrimaryKey__2 = bigint;
export interface RemoveBlockUpdateInput {
  uuid: UUID;
}
export type RemoveBlockUpdateOutput =
  | { ok: RemoveBlockUpdateOutputResult }
  | { err: RemoveBlockUpdateOutputError };
export type RemoveBlockUpdateOutputError = null;
export type RemoveBlockUpdateOutputResult = null;
export type Result = { ok: ShareableBlock } | { err: { pageNotFound: null } };
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
        payload: SaveEventUpdateInputBlockCreatedPaylaod;
        eventType: { blockCreated: null };
      };
    }
  | {
      blockTypeChanged: {
        payload: { blockType: BlockType; blockExternalId: UUID };
        eventType: { blockTypeChanged: null };
      };
    }
  | {
      blockUpdated: {
        payload: {
          transactions: Array<BlockUpdatedEventTransaction>;
          blockExternalId: UUID;
        };
        eventType: { blockUpdated: null };
      };
    };
export interface SaveEventUpdateInputBlockCreatedPaylaod {
  block: {
    content: BlockContent;
    uuid: UUID;
    blockType: BlockType;
    properties: ShareableBlockProperties;
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
export type SortDirection = { asc: null } | { desc: null };
export interface SortOrder {
  direction: SortDirection;
  fieldName: string;
}
export type Time = bigint;
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
export interface Workspace {
  addBlock: ActorMethod<[AddBlockUpdateInput], AddBlockUpdateOutput>;
  blockByUuid: ActorMethod<[UUID], Result_1>;
  createPage: ActorMethod<[CreatePageUpdateInput], CreatePageUpdateOutput>;
  getInitArgs: ActorMethod<
    [],
    {
      ownerPrincipal: Principal;
      workspaceIndexPrincipal: Principal;
      capacity: bigint;
    }
  >;
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
  removeBlock: ActorMethod<[RemoveBlockUpdateInput], RemoveBlockUpdateOutput>;
  saveEvent: ActorMethod<[SaveEventUpdateInput], SaveEventUpdateOutput>;
  updateBlock: ActorMethod<[UpdateBlockUpdateInput], UpdateBlockUpdateOutput>;
}
export interface _SERVICE extends Workspace {}
