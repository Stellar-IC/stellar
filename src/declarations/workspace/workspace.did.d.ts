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
  id: PrimaryKey__1;
}
export type AllocationStrategy =
  | { boundaryPlus: null }
  | { boundaryMinus: null };
export type BlockByUuidResult =
  | { ok: ShareableBlock }
  | { err: { blockNotFound: null } };
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
  | { blockCreated: BlockCreatedEvent }
  | { empty: null }
  | { blockUpdated: BlockUpdatedEvent };
export type BlockEventTransaction = Array<BlockEvent>;
export interface BlockParentUpdatedEvent {
  data: { parentBlockExternalId: UUID; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export interface BlockPropertyCheckedUpdatedEvent {
  data: { checked: boolean; blockExternalId: UUID };
  user: Principal;
  uuid: UUID;
}
export interface BlockPropertyTitleUpdatedEvent {
  data: { transaction: Array<TreeEvent>; blockExternalId: UUID };
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
      updatePropertyChecked: BlockPropertyCheckedUpdatedEvent;
    }
  | { updateBlockType: BlockTypeUpdatedEvent }
  | { updateContent: BlockContentUpdatedEvent }
  | { updateParent: BlockParentUpdatedEvent }
  | { updatePropertyTitle: BlockPropertyTitleUpdatedEvent };
export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterLogFeature =
  | { filterMessageByContains: null }
  | { filterMessageByRegex: null };
export interface CanisterLogMessages {
  data: Array<LogMessagesData>;
  lastAnalyzedMessageTimeNanos: [] | [Nanos];
}
export interface CanisterLogMessagesInfo {
  features: Array<[] | [CanisterLogFeature]>;
  lastTimeNanos: [] | [Nanos];
  count: number;
  firstTimeNanos: [] | [Nanos];
}
export type CanisterLogRequest =
  | { getMessagesInfo: null }
  | { getMessages: GetLogMessagesParameters }
  | { getLatestMessages: GetLatestLogMessagesParameters };
export type CanisterLogResponse =
  | { messagesInfo: CanisterLogMessagesInfo }
  | { messages: CanisterLogMessages };
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics {
  data: CanisterMetricsData;
}
export type CanisterMetricsData =
  | { hourly: Array<HourlyMetricsData> }
  | { daily: Array<DailyMetricsData> };
export type CollectMetricsRequestType = { force: null } | { normal: null };
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
export interface DailyMetricsData {
  updateCalls: bigint;
  canisterHeapMemorySize: NumericEntity;
  canisterCycles: NumericEntity;
  canisterMemorySize: NumericEntity;
  timeMillis: bigint;
}
export interface DeletePageUpdateInput {
  uuid: UUID;
}
export type DeletePageUpdateOutput =
  | { ok: DeletePageUpdateOutputResult }
  | { err: DeletePageUpdateOutputError };
export type DeletePageUpdateOutputError = null;
export type DeletePageUpdateOutputResult = null;
export interface Edge {
  node: ShareableBlock;
}
export interface GetInformationRequest {
  status: [] | [StatusRequest];
  metrics: [] | [MetricsRequest];
  logs: [] | [CanisterLogRequest];
  version: boolean;
}
export interface GetInformationResponse {
  status: [] | [StatusResponse];
  metrics: [] | [MetricsResponse];
  logs: [] | [CanisterLogResponse];
  version: [] | [bigint];
}
export interface GetLatestLogMessagesParameters {
  upToTimeNanos: [] | [Nanos];
  count: number;
  filter: [] | [GetLogMessagesFilter];
}
export interface GetLogMessagesFilter {
  analyzeCount: number;
  messageRegex: [] | [string];
  messageContains: [] | [string];
}
export interface GetLogMessagesParameters {
  count: number;
  filter: [] | [GetLogMessagesFilter];
  fromTimeNanos: [] | [Nanos];
}
export interface GetMetricsParameters {
  dateToMillis: bigint;
  granularity: MetricsGranularity;
  dateFromMillis: bigint;
}
export interface HourlyMetricsData {
  updateCalls: UpdateCallsAggregatedData;
  canisterHeapMemorySize: CanisterHeapMemoryAggregatedData;
  canisterCycles: CanisterCyclesAggregatedData;
  canisterMemorySize: CanisterMemoryAggregatedData;
  timeMillis: bigint;
}
export type List = [] | [[ShareableBlock__1, List]];
export interface LogMessagesData {
  timeNanos: Nanos;
  message: string;
}
export type MetricsGranularity = { hourly: null } | { daily: null };
export interface MetricsRequest {
  parameters: GetMetricsParameters;
}
export interface MetricsResponse {
  metrics: [] | [CanisterMetrics];
}
export type Nanos = bigint;
export type NodeBase = number;
export type NodeBoundary = number;
export type NodeDepth = number;
export type NodeIdentifier = Uint16Array | number[];
export type NodeIndex = number;
export type NodeValue = string;
export interface NumericEntity {
  avg: bigint;
  max: bigint;
  min: bigint;
  first: bigint;
  last: bigint;
}
export type PageByUuidResult =
  | { ok: ShareableBlock }
  | { err: { pageNotFound: null } };
export interface PagesOptionsArg {
  order: [] | [SortOrder];
  cursor: [] | [PrimaryKey__1];
  limit: [] | [bigint];
}
export interface PagesResult {
  edges: Array<Edge>;
}
export type PrimaryKey = bigint;
export type PrimaryKey__1 = bigint;
export type Result = { ok: null } | { err: { unauthorized: null } };
export type Result_1 =
  | { ok: GetInformationResponse }
  | { err: { unauthorized: null } };
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
export interface ShareableBlock__1 {
  id: PrimaryKey;
  content: ShareableBlockContent;
  uuid: UUID;
  blockType: BlockType;
  properties: ShareableBlockProperties;
  parent: [] | [UUID];
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
export interface StatusRequest {
  memory_size: boolean;
  cycles: boolean;
  heap_memory_size: boolean;
}
export interface StatusResponse {
  memory_size: [] | [bigint];
  cycles: [] | [bigint];
  heap_memory_size: [] | [bigint];
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
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UpdateInformationRequest {
  metrics: [] | [CollectMetricsRequestType];
}
export interface Workspace {
  addBlock: ActorMethod<[AddBlockUpdateInput], AddBlockUpdateOutput>;
  blockByUuid: ActorMethod<[UUID], BlockByUuidResult>;
  blocksByPageUuid: ActorMethod<[string], List>;
  createPage: ActorMethod<[CreatePageUpdateInput], CreatePageUpdateOutput>;
  cyclesInformation: ActorMethod<[], { balance: bigint; capacity: bigint }>;
  deletePage: ActorMethod<[DeletePageUpdateInput], DeletePageUpdateOutput>;
  getCanistergeekInformation: ActorMethod<[GetInformationRequest], Result_1>;
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
  pageByUuid: ActorMethod<[UUID], PageByUuidResult>;
  pages: ActorMethod<[PagesOptionsArg], PagesResult>;
  saveEvents: ActorMethod<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >;
  toObject: ActorMethod<[], Workspace__1>;
  updateBlock: ActorMethod<[UpdateBlockUpdateInput], UpdateBlockUpdateOutput>;
  updateCanistergeekInformation: ActorMethod<
    [UpdateInformationRequest],
    Result
  >;
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
