import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddBlockUpdateInput {
  content: ShareableBlockContent;
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
export interface BlockContentUpdatedEvent {
  data: { transaction: Array<TreeEvent>; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export interface BlockCreatedEvent {
  data: {
    block: {
      uuid: UUID;
      blockType: BlockType;
      parent: [] | [UUID];
    };
    index: bigint;
  };
  user: Principal;
  uuid: UUID;
}
export type BlockEvent =
  | { blockRemoved: BlockRemovedEvent }
  | { blockCreated: BlockCreatedEvent }
  | { empty: null }
  | { blockUpdated: BlockUpdatedEvent };
export type BlockEventTransaction = Array<BlockEvent>;
export interface BlockParentUpdatedEvent {
  data: { parentBlockExternalId: UUID; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export interface BlockProperyCheckedUpdatedEvent {
  data: { checked: boolean; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export interface BlockProperyTitleUpdatedEvent {
  data: { transaction: Array<TreeEvent>; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export interface BlockRemovedEvent {
  data: { block: { uuid: UUID; parent: UUID }; index: bigint };
  user: Principal;
  uuid: UUID;
}
export type BlockType =
  | { numberedList: null }
  | { todoList: null }
  | { toggleHeading1: null }
  | { toggleHeading2: null }
  | { toggleHeading3: null }
  | { code: null }
  | { heading1: null }
  | { heading2: null }
  | { heading3: null }
  | { page: null }
  | { callout: null }
  | { quote: null }
  | { bulletedList: null }
  | { paragraph: null }
  | { toggleList: null };
export interface BlockTypeUpdatedEvent {
  data: { blockType: BlockType; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export type BlockUpdatedEvent =
  | {
      updatePropertyChecked: BlockProperyCheckedUpdatedEvent;
    }
  | { updateBlockType: BlockTypeUpdatedEvent }
  | { updateContent: BlockContentUpdatedEvent }
  | { updateParent: BlockParentUpdatedEvent }
  | { updatePropertyTitle: BlockProperyTitleUpdatedEvent };
export interface CreatePageUpdateInput {
  content: ShareableBlockContent;
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
  content: ShareableBlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export interface Edge {
  node: ShareableBlock;
}
export type List = [] | [[ShareableBlock, List]];
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
export interface SaveEventTransactionUpdateInput {
  transaction: BlockEventTransaction;
}
export type SaveEventTransactionUpdateOutput =
  | {
      ok: SaveEventTransactionUpdateOutputResult;
    }
  | { err: SaveEventTransactionUpdateOutputError };
export type SaveEventTransactionUpdateOutputError =
  | { anonymousUser: null }
  | { insufficientCycles: null };
export type SaveEventTransactionUpdateOutputResult = null;
export interface ShareableBlock {
  id: PrimaryKey;
  content: ShareableBlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export interface ShareableBlockContent {
  boundary: NodeBoundary;
  allocationStrategies: Array<[NodeDepth, AllocationStrategy]>;
  rootNode: ShareableNode;
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
export type TreeEvent =
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
  content: ShareableBlockContent;
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
  content: ShareableBlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
}
export interface Workspace {
  addBlock: ActorMethod<[AddBlockUpdateInput], AddBlockUpdateOutput>;
  blockByUuid: ActorMethod<[UUID], Result_1>;
  blocksByPageUuid: ActorMethod<[string], List>;
  createPage: ActorMethod<[CreatePageUpdateInput], CreatePageUpdateOutput>;
  cyclesInformation: ActorMethod<[], { balance: bigint; capacity: bigint }>;
  getInitArgs: ActorMethod<[], { owner: Principal; capacity: bigint }>;
  getInitData: ActorMethod<
    [],
    {
      name: WorkspaceName;
      createdAt: Time;
      uuid: UUID;
      description: WorkspaceDescription;
      updatedAt: Time;
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
  saveEvents: ActorMethod<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >;
  toObject: ActorMethod<[], Workspace__1>;
  updateBlock: ActorMethod<[UpdateBlockUpdateInput], UpdateBlockUpdateOutput>;
  walletReceive: ActorMethod<[], { accepted: bigint }>;
}
export type WorkspaceDescription = string;
export interface WorkspaceInitArgs {
  owner: Principal;
  capacity: bigint;
}
export interface WorkspaceInitData {
  name: WorkspaceName;
  createdAt: Time;
  uuid: UUID;
  description: WorkspaceDescription;
  updatedAt: Time;
}
export type WorkspaceName = string;
export type WorkspaceOwner = Principal;
export interface Workspace__1 {
  owner: WorkspaceOwner;
  name: WorkspaceName;
  createdAt: Time;
  uuid: UUID;
  description: WorkspaceDescription;
  updatedAt: Time;
}
export interface _SERVICE extends Workspace {}
