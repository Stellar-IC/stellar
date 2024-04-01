import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ActivityId = bigint;
export interface ActivityLogOutput { 'edges' : Array<Edge_2> }
export interface AddBlockUpdateInput {
  'content' : ShareableBlockContent,
  'uuid' : UUID,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [UUID],
}
export type AddBlockUpdateOutput = { 'ok' : AddBlockUpdateOutputResult } |
  { 'err' : AddBlockUpdateOutputError };
export type AddBlockUpdateOutputError = { 'unauthorized' : null };
export type AddBlockUpdateOutputResult = null;
export type AddUsersUpdateInput = Array<[Principal, WorkspaceUser]>;
export type AddUsersUpdateResult = { 'ok' : null } |
  { 'err' : { 'unauthorized' : null } };
export type AllocationStrategy = { 'boundaryPlus' : null } |
  { 'boundaryMinus' : null };
export interface BlockBlockTypeUpdatedEventData {
  'blockType' : BlockType,
  'blockExternalId' : UUID,
}
export interface BlockByUuidOptions {
  'contentPagination' : { 'cursor' : bigint, 'limit' : bigint },
}
export type BlockByUuidResult = {
    'ok' : {
      'block' : ExternalId,
      'recordMap' : { 'blocks' : Array<[ExternalId, ShareableBlock]> },
    }
  } |
  { 'err' : { 'notFound' : null } };
export interface BlockContentUpdatedEventData {
  'transaction' : Array<TreeEvent>,
  'blockExternalId' : UUID,
}
export interface BlockCreatedEventData {
  'block' : { 'uuid' : UUID, 'blockType' : BlockType, 'parent' : [] | [UUID] },
  'index' : bigint,
}
export interface BlockEvent {
  'data' : { 'blockCreated' : BlockCreatedEventData } |
    { 'blockUpdated' : BlockUpdatedEventData },
  'user' : Principal,
  'uuid' : UUID,
  'timestamp' : Time,
}
export type BlockEventTransaction = Array<BlockEvent>;
export interface BlockParentUpdatedEventData {
  'parentBlockExternalId' : UUID,
  'blockExternalId' : UUID,
}
export interface BlockPropertyCheckedUpdatedEventData {
  'checked' : boolean,
  'blockExternalId' : UUID,
}
export interface BlockPropertyTitleUpdatedEventData {
  'transaction' : Array<TreeEvent>,
  'blockExternalId' : UUID,
}
export type BlockType = { 'numberedList' : null } |
  { 'todoList' : null } |
  { 'toggleHeading1' : null } |
  { 'toggleHeading2' : null } |
  { 'toggleHeading3' : null } |
  { 'code' : null } |
  { 'heading1' : null } |
  { 'heading2' : null } |
  { 'heading3' : null } |
  { 'page' : null } |
  { 'callout' : null } |
  { 'quote' : null } |
  { 'bulletedList' : null } |
  { 'paragraph' : null };
export type BlockType__1 = { 'numberedList' : null } |
  { 'todoList' : null } |
  { 'toggleHeading1' : null } |
  { 'toggleHeading2' : null } |
  { 'toggleHeading3' : null } |
  { 'code' : null } |
  { 'heading1' : null } |
  { 'heading2' : null } |
  { 'heading3' : null } |
  { 'page' : null } |
  { 'callout' : null } |
  { 'quote' : null } |
  { 'bulletedList' : null } |
  { 'paragraph' : null };
export type BlockUpdatedEventData = {
    'updatePropertyChecked' : BlockPropertyCheckedUpdatedEventData
  } |
  { 'updateBlockType' : BlockBlockTypeUpdatedEventData } |
  { 'updateContent' : BlockContentUpdatedEventData } |
  { 'updateParent' : BlockParentUpdatedEventData } |
  { 'updatePropertyTitle' : BlockPropertyTitleUpdatedEventData };
export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterLogFeature = { 'filterMessageByContains' : null } |
  { 'filterMessageByRegex' : null };
export interface CanisterLogMessages {
  'data' : Array<LogMessagesData>,
  'lastAnalyzedMessageTimeNanos' : [] | [Nanos],
}
export interface CanisterLogMessagesInfo {
  'features' : Array<[] | [CanisterLogFeature]>,
  'lastTimeNanos' : [] | [Nanos],
  'count' : number,
  'firstTimeNanos' : [] | [Nanos],
}
export type CanisterLogRequest = { 'getMessagesInfo' : null } |
  { 'getMessages' : GetLogMessagesParameters } |
  { 'getLatestMessages' : GetLatestLogMessagesParameters };
export type CanisterLogResponse = { 'messagesInfo' : CanisterLogMessagesInfo } |
  { 'messages' : CanisterLogMessages };
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics { 'data' : CanisterMetricsData }
export type CanisterMetricsData = { 'hourly' : Array<HourlyMetricsData> } |
  { 'daily' : Array<DailyMetricsData> };
export type CollectMetricsRequestType = { 'force' : null } |
  { 'normal' : null };
export interface CreatePageUpdateInput {
  'initialBlockUuid' : [] | [UUID],
  'content' : ShareableBlockContent,
  'uuid' : UUID,
  'properties' : ShareableBlockProperties__1,
  'parent' : [] | [UUID],
}
export type CreatePageUpdateOutput = { 'ok' : CreatePageUpdateOutputResult } |
  { 'err' : CreatePageUpdateOutputError };
export type CreatePageUpdateOutputError = { 'failedToCreate' : null } |
  { 'anonymousUser' : null } |
  { 'invalidBlockType' : null } |
  { 'insufficientCycles' : null } |
  { 'inputTooLong' : null };
export interface CreatePageUpdateOutputResult {
  'content' : ShareableBlockContent,
  'uuid' : UUID,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [UUID],
}
export interface DailyMetricsData {
  'updateCalls' : bigint,
  'canisterHeapMemorySize' : NumericEntity,
  'canisterCycles' : NumericEntity,
  'canisterMemorySize' : NumericEntity,
  'timeMillis' : bigint,
}
export interface DeletePageUpdateInput { 'uuid' : UUID }
export type DeletePageUpdateOutput = { 'ok' : DeletePageUpdateOutputResult } |
  { 'err' : DeletePageUpdateOutputError };
export type DeletePageUpdateOutputError = null;
export type DeletePageUpdateOutputResult = null;
export interface Edge { 'node' : ExternalId }
export interface Edge_1 { 'node' : Principal }
export interface Edge_2 { 'node' : HydratedActivity }
export type ExternalId = string;
export interface GetInformationRequest {
  'status' : [] | [StatusRequest],
  'metrics' : [] | [MetricsRequest],
  'logs' : [] | [CanisterLogRequest],
  'version' : boolean,
}
export interface GetInformationResponse {
  'status' : [] | [StatusResponse],
  'metrics' : [] | [MetricsResponse],
  'logs' : [] | [CanisterLogResponse],
  'version' : [] | [bigint],
}
export type GetInitArgsOutput = { 'ok' : WorkspaceInitArgs__1 } |
  { 'err' : { 'unauthorized' : null } };
export type GetInitDataOutput = { 'ok' : WorkspaceInitData__1 } |
  { 'err' : { 'unauthorized' : null } };
export interface GetLatestLogMessagesParameters {
  'upToTimeNanos' : [] | [Nanos],
  'count' : number,
  'filter' : [] | [GetLogMessagesFilter],
}
export interface GetLogMessagesFilter {
  'analyzeCount' : number,
  'messageRegex' : [] | [string],
  'messageContains' : [] | [string],
}
export interface GetLogMessagesParameters {
  'count' : number,
  'filter' : [] | [GetLogMessagesFilter],
  'fromTimeNanos' : [] | [Nanos],
}
export interface GetMetricsParameters {
  'dateToMillis' : bigint,
  'granularity' : MetricsGranularity,
  'dateFromMillis' : bigint,
}
export interface HourlyMetricsData {
  'updateCalls' : UpdateCallsAggregatedData,
  'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
  'canisterCycles' : CanisterCyclesAggregatedData,
  'canisterMemorySize' : CanisterMemoryAggregatedData,
  'timeMillis' : bigint,
}
export interface HydratedActivity {
  'id' : ActivityId,
  'startTime' : Time,
  'endTime' : Time,
  'edits' : Array<HydratedEditItem>,
  'users' : Array<HydratedEditItemUser>,
  'blockExternalId' : UUID,
}
export interface HydratedEditItem {
  'startTime' : Time,
  'blockValue' : {
    'after' : ShareableBlock__1,
    'before' : [] | [ShareableBlock__1],
  },
  'user' : HydratedEditItemUser,
}
export interface HydratedEditItemUser {
  'username' : string,
  'canisterId' : Principal,
}
export interface LogMessagesData { 'timeNanos' : Nanos, 'message' : string }
export interface MembersOutput {
  'users' : PaginatedResults_1,
  'recordMap' : { 'users' : Array<[Principal, WorkspaceUser]> },
}
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export interface MetricsRequest { 'parameters' : GetMetricsParameters }
export interface MetricsResponse { 'metrics' : [] | [CanisterMetrics] }
export type Nanos = bigint;
export type NodeBase = number;
export type NodeBoundary = number;
export type NodeDepth = number;
export type NodeIdentifier = Uint16Array | number[];
export type NodeIndex = number;
export type NodeValue = string;
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export interface PagesOptionsArg {
  'order' : [] | [SortOrder],
  'cursor' : [] | [PrimaryKey],
  'limit' : [] | [bigint],
}
export interface PagesOutput {
  'pages' : PaginatedResults,
  'recordMap' : { 'blocks' : Array<[ExternalId, ShareableBlock]> },
}
export interface PaginatedResults { 'edges' : Array<Edge> }
export interface PaginatedResults_1 { 'edges' : Array<Edge_1> }
export type PrimaryKey = bigint;
export interface SaveEventTransactionUpdateInput {
  'transaction' : BlockEventTransaction,
}
export type SaveEventTransactionUpdateOutput = {
    'ok' : SaveEventTransactionUpdateOutputResult
  } |
  { 'err' : SaveEventTransactionUpdateOutputError };
export type SaveEventTransactionUpdateOutputError = { 'anonymousUser' : null } |
  { 'insufficientCycles' : null };
export type SaveEventTransactionUpdateOutputResult = null;
export interface SettingsOutput {
  'websiteLink' : string,
  'name' : string,
  'description' : string,
  'visibility' : WorkspaceVisibility,
}
export interface ShareableBlock {
  'content' : ShareableBlockContent,
  'uuid' : UUID,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [UUID],
}
export interface ShareableBlockContent {
  'boundary' : NodeBoundary,
  'allocationStrategies' : Array<[NodeDepth, AllocationStrategy]>,
  'rootNode' : ShareableNode,
}
export interface ShareableBlockContent__1 {
  'boundary' : NodeBoundary,
  'allocationStrategies' : Array<[NodeDepth, AllocationStrategy]>,
  'rootNode' : ShareableNode,
}
export interface ShareableBlockProperties {
  'title' : [] | [ShareableBlockText],
  'checked' : [] | [boolean],
}
export interface ShareableBlockProperties__1 {
  'title' : [] | [ShareableBlockText],
  'checked' : [] | [boolean],
}
export interface ShareableBlockProperties__2 {
  'title' : [] | [ShareableBlockText__1],
  'checked' : [] | [boolean],
}
export interface ShareableBlockText {
  'boundary' : NodeBoundary,
  'allocationStrategies' : Array<[NodeDepth, AllocationStrategy]>,
  'rootNode' : ShareableNode,
}
export interface ShareableBlockText__1 {
  'boundary' : NodeBoundary,
  'allocationStrategies' : Array<[NodeDepth, AllocationStrategy]>,
  'rootNode' : ShareableNode,
}
export interface ShareableBlock__1 {
  'content' : ShareableBlockContent__1,
  'uuid' : UUID,
  'blockType' : BlockType__1,
  'properties' : ShareableBlockProperties__2,
  'parent' : [] | [UUID],
}
export interface ShareableNode {
  'value' : NodeValue,
  'base' : NodeBase,
  'children' : Array<[NodeIndex, ShareableNode]>,
  'identifier' : NodeIdentifier,
  'deletedAt' : [] | [Time],
}
export type SortDirection = { 'asc' : null } |
  { 'desc' : null };
export interface SortOrder { 'direction' : SortDirection, 'fieldName' : string }
export interface StatusRequest {
  'memory_size' : boolean,
  'cycles' : boolean,
  'heap_memory_size' : boolean,
}
export interface StatusResponse {
  'memory_size' : [] | [bigint],
  'cycles' : [] | [bigint],
  'heap_memory_size' : [] | [bigint],
}
export type Time = bigint;
export type TreeEvent = {
    'delete' : {
      'transactionType' : { 'delete' : null },
      'position' : NodeIdentifier,
    }
  } |
  {
    'insert' : {
      'transactionType' : { 'insert' : null },
      'value' : NodeValue,
      'position' : NodeIdentifier,
    }
  };
export type UUID = Uint8Array | number[];
export interface UpdateBlockUpdateInput {
  'content' : ShareableBlockContent,
  'uuid' : UUID,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [UUID],
}
export type UpdateBlockUpdateOutput = { 'ok' : UpdateBlockUpdateOutputResult } |
  { 'err' : UpdateBlockUpdateOutputError };
export type UpdateBlockUpdateOutputError = { 'primaryKeyAttrNotFound' : null };
export interface UpdateBlockUpdateOutputResult {
  'content' : ShareableBlockContent,
  'uuid' : UUID,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [UUID],
}
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UpdateInformationRequest {
  'metrics' : [] | [CollectMetricsRequestType],
}
export interface UpdateSettingsUpdateInput {
  'websiteLink' : [] | [string],
  'name' : [] | [string],
  'description' : [] | [string],
  'visibility' : [] | [WorkspaceVisibility],
}
export type UpdateSettingsUpdateOutput = {
    'ok' : UpdateSettingsUpdateOutputOk
  } |
  { 'err' : UpdateSettingsUpdateOutputError };
export type UpdateSettingsUpdateOutputError = { 'unauthorized' : null };
export type UpdateSettingsUpdateOutputOk = null;
export interface UpdateUserRoleUpdateInput {
  'role' : WorkspaceUserRole,
  'user' : Principal,
}
export type UpdateUserRoleUpdateOutput = {
    'ok' : UpdateUserRoleUpdateOutputOk
  } |
  { 'err' : UpdateUserRoleUpdateOutputError };
export type UpdateUserRoleUpdateOutputError = { 'unauthorized' : null };
export type UpdateUserRoleUpdateOutputOk = null;
export interface Workspace {
  'activityLog' : ActorMethod<[UUID], ActivityLogOutput>,
  'addBlock' : ActorMethod<[AddBlockUpdateInput], AddBlockUpdateOutput>,
  'addUsers' : ActorMethod<[AddUsersUpdateInput], AddUsersUpdateResult>,
  'block' : ActorMethod<[UUID, BlockByUuidOptions], BlockByUuidResult>,
  'createPage' : ActorMethod<[CreatePageUpdateInput], CreatePageUpdateOutput>,
  'deletePage' : ActorMethod<[DeletePageUpdateInput], DeletePageUpdateOutput>,
  'getCanistergeekInformation' : ActorMethod<
    [GetInformationRequest],
    GetInformationResponse
  >,
  'getInitArgs' : ActorMethod<[], GetInitArgsOutput>,
  'getInitData' : ActorMethod<[], GetInitDataOutput>,
  'markUserActive' : ActorMethod<[UUID], undefined>,
  'members' : ActorMethod<[], MembersOutput>,
  'pages' : ActorMethod<[PagesOptionsArg], PagesOutput>,
  'saveEvents' : ActorMethod<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >,
  'settings' : ActorMethod<[], SettingsOutput>,
  'toObject' : ActorMethod<[], Workspace__1>,
  'updateBlock' : ActorMethod<
    [UpdateBlockUpdateInput],
    UpdateBlockUpdateOutput
  >,
  'updateCanistergeekInformation' : ActorMethod<
    [UpdateInformationRequest],
    undefined
  >,
  'updateSettings' : ActorMethod<
    [UpdateSettingsUpdateInput],
    UpdateSettingsUpdateOutput
  >,
  'updateUserRole' : ActorMethod<
    [UpdateUserRoleUpdateInput],
    UpdateUserRoleUpdateOutput
  >,
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
}
export type WorkspaceDescription = string;
export interface WorkspaceInitArgs {
  'owner' : WorkspaceOwner,
  'capacity' : bigint,
}
export interface WorkspaceInitArgs__1 {
  'owner' : WorkspaceOwner__1,
  'capacity' : bigint,
}
export interface WorkspaceInitData {
  'name' : WorkspaceName,
  'createdAt' : Time,
  'uuid' : UUID,
  'description' : WorkspaceDescription,
  'updatedAt' : Time,
}
export interface WorkspaceInitData__1 {
  'name' : string,
  'createdAt' : Time,
  'uuid' : UUID,
  'description' : string,
  'updatedAt' : Time,
}
export type WorkspaceName = string;
export type WorkspaceOwner = Principal;
export type WorkspaceOwner__1 = Principal;
export interface WorkspaceUser {
  'username' : string,
  'role' : WorkspaceUserRole,
  'identity' : Principal,
  'canisterId' : Principal,
}
export type WorkspaceUserRole = { 'member' : null } |
  { 'admin' : null } |
  { 'moderator' : null } |
  { 'guest' : null };
export type WorkspaceVisibility = { 'Private' : null } |
  { 'Public' : null };
export interface Workspace__1 {
  'owner' : WorkspaceOwner,
  'name' : WorkspaceName,
  'createdAt' : Time,
  'uuid' : UUID,
  'description' : WorkspaceDescription,
  'updatedAt' : Time,
}
export interface _SERVICE extends Workspace {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
