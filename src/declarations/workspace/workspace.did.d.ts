import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ActivityId = bigint;
export interface ActivityLogOutput { 'edges' : Array<Edge_2> }
export interface AddBlockInput {
  'content' : ShareableBlockContent,
  'uuid' : BlockId__1,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [BlockId__1],
}
export type AddBlockOutput = { 'ok' : AddBlockOutputResult } |
  { 'err' : AddBlockOutputError };
export type AddBlockOutputError = { 'unauthorized' : null };
export type AddBlockOutputResult = null;
export type AllocationStrategy = { 'boundaryPlus' : null } |
  { 'boundaryMinus' : null };
export interface BlockBlockTypeUpdatedEventData {
  'blockType' : BlockType,
  'blockExternalId' : BlockId,
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
  'blockExternalId' : BlockId,
}
export interface BlockCreatedEventData {
  'block' : {
    'uuid' : BlockId,
    'blockType' : BlockType,
    'parent' : [] | [BlockId],
  },
  'index' : bigint,
}
export interface BlockEvent {
  'data' : { 'blockCreated' : BlockCreatedEventData } |
    { 'blockUpdated' : BlockUpdatedEventData },
  'user' : Principal,
  'uuid' : BlockId,
  'timestamp' : Time,
}
export type BlockEventTransaction = Array<BlockEvent>;
export type BlockId = Uint8Array | number[];
export type BlockId__1 = Uint8Array | number[];
export interface BlockParentUpdatedEventData {
  'parentBlockExternalId' : BlockId,
  'blockExternalId' : BlockId,
}
export interface BlockPropertyCheckedUpdatedEventData {
  'checked' : boolean,
  'blockExternalId' : BlockId,
}
export interface BlockPropertyTitleUpdatedEventData {
  'transaction' : Array<TreeEvent>,
  'blockExternalId' : BlockId,
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
export type BlockUpdatedEventData = {
    'updatePropertyChecked' : BlockPropertyCheckedUpdatedEventData
  } |
  { 'updateBlockType' : BlockBlockTypeUpdatedEventData } |
  { 'updateContent' : BlockContentUpdatedEventData } |
  { 'updateParent' : BlockParentUpdatedEventData } |
  { 'updatePropertyTitle' : BlockPropertyTitleUpdatedEventData };
export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterId = Principal;
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
export interface CreatePageInput {
  'initialBlockUuid' : [] | [BlockId__1],
  'content' : ShareableBlockContent,
  'uuid' : BlockId__1,
  'properties' : ShareableBlockProperties__1,
  'parent' : [] | [BlockId__1],
}
export type CreatePageOutput = { 'ok' : CreatePageOutputResult } |
  { 'err' : CreatePageOutputError };
export type CreatePageOutputError = { 'failedToCreate' : null } |
  { 'anonymousUser' : null } |
  { 'invalidBlockType' : null } |
  { 'insufficientCycles' : null } |
  { 'unauthorized' : null } |
  { 'inputTooLong' : null };
export interface CreatePageOutputResult {
  'content' : ShareableBlockContent,
  'uuid' : BlockId,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [BlockId],
}
export interface DailyMetricsData {
  'updateCalls' : bigint,
  'canisterHeapMemorySize' : NumericEntity,
  'canisterCycles' : NumericEntity,
  'canisterMemorySize' : NumericEntity,
  'timeMillis' : bigint,
}
export interface DeletePageInput { 'uuid' : BlockId__1 }
export type DeletePageOutput = { 'ok' : DeletePageOutputResult } |
  { 'err' : DeletePageOutputError };
export type DeletePageOutputError = { 'unauthorized' : null };
export type DeletePageOutputResult = null;
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
export type PageAccessLevel = { 'edit' : null } |
  { 'full' : null } |
  { 'none' : null } |
  { 'view' : null };
export type PageAccessSetting = { 'everyone' : PageAccessLevel } |
  { 'invited' : null } |
  { 'workspaceMember' : PageAccessLevel };
export interface PageAccessSettingsOutput {
  'invitedUsers' : Array<
    { 'access' : PageAccessLevel, 'user' : WorkspaceUser }
  >,
  'accessSetting' : PageAccessSetting,
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
export interface ProfileUpdatedEventData { 'profile' : UserProfile }
export type PubSubEvent = {
    'workspaceNameUpdated' : { 'name' : string, 'workspaceId' : Principal }
  };
export type PubSubEventHandler = ActorMethod<[string, PubSubEvent], undefined>;
export type Result = { 'ok' : SettingsOutput } |
  { 'err' : { 'unauthorized' : null } };
export type Result_1 = { 'ok' : null } |
  { 'err' : { 'unauthorized' : null } | { 'userUpdateFailure' : null } };
export type Result_2 = { 'ok' : null } |
  {
    'err' : { 'profileQueryFailure' : null } |
      { 'unauthorized' : null } |
      { 'userUpdateFailure' : null }
  };
export type Result_3 = { 'ok' : Workspace__1 } |
  { 'err' : { 'unauthorized' : null } };
export interface SaveEventTransactionInput {
  'transaction' : BlockEventTransaction,
}
export type SaveEventTransactionOutput = {
    'ok' : SaveEventTransactionOutputResult
  } |
  { 'err' : SaveEventTransactionOutputError };
export type SaveEventTransactionOutputError = { 'anonymousUser' : null } |
  { 'insufficientCycles' : null };
export type SaveEventTransactionOutputResult = null;
export interface SetPageAccessInput {
  'access' : PageAccessSetting,
  'pageId' : BlockId__1,
}
export type SetPageAccessOutput = { 'ok' : SetPageAccessOutputResult } |
  { 'err' : SetPageAccessOutputError };
export type SetPageAccessOutputError = { 'unauthorized' : null };
export type SetPageAccessOutputResult = null;
export interface SetUserAccessLevelForPageInput {
  'accessLevel' : PageAccessLevel,
  'userId' : Principal,
  'pageId' : BlockId__1,
}
export type SetUserAccessLevelForPageOutput = {
    'ok' : SetUserAccessLevelForPageOutputResult
  } |
  { 'err' : SetUserAccessLevelForPageOutputError };
export type SetUserAccessLevelForPageOutputError = { 'userNotFound' : null } |
  { 'unauthorized' : null };
export type SetUserAccessLevelForPageOutputResult = null;
export interface SettingsOutput {
  'websiteLink' : string,
  'name' : string,
  'description' : string,
  'visibility' : WorkspaceVisibility,
}
export interface ShareableBlock {
  'content' : ShareableBlockContent,
  'uuid' : BlockId,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [BlockId],
}
export interface ShareableBlockContent {
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
export interface ShareableBlockText {
  'boundary' : NodeBoundary,
  'allocationStrategies' : Array<[NodeDepth, AllocationStrategy]>,
  'rootNode' : ShareableNode,
}
export interface ShareableBlock__1 {
  'content' : ShareableBlockContent,
  'uuid' : BlockId,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [BlockId],
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
export interface UpdateBlockInput {
  'content' : ShareableBlockContent,
  'uuid' : BlockId,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [BlockId],
}
export type UpdateBlockOutput = { 'ok' : UpdateBlockOutputResult } |
  { 'err' : UpdateBlockOutputError };
export type UpdateBlockOutputError = { 'primaryKeyAttrNotFound' : null };
export interface UpdateBlockOutputResult {
  'content' : ShareableBlockContent,
  'uuid' : BlockId,
  'blockType' : BlockType,
  'properties' : ShareableBlockProperties,
  'parent' : [] | [BlockId],
}
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UpdateInformationRequest {
  'metrics' : [] | [CollectMetricsRequestType],
}
export interface UpdateSettingsInput {
  'websiteLink' : [] | [string],
  'name' : [] | [string],
  'description' : [] | [string],
  'visibility' : [] | [WorkspaceVisibility],
}
export type UpdateSettingsOutput = { 'ok' : UpdateSettingsOutputOk } |
  { 'err' : UpdateSettingsOutputError };
export type UpdateSettingsOutputError = { 'unauthorized' : null };
export type UpdateSettingsOutputOk = null;
export interface UpdateUserRoleInput {
  'role' : WorkspaceUserRole,
  'user' : Principal,
}
export type UpdateUserRoleOutput = { 'ok' : UpdateUserRoleOutputOk } |
  { 'err' : UpdateUserRoleOutputError };
export type UpdateUserRoleOutputError = { 'unauthorized' : null };
export type UpdateUserRoleOutputOk = null;
export interface UserEvent {
  'userId' : Principal,
  'event' : { 'profileUpdated' : ProfileUpdatedEventData },
}
export interface UserProfile {
  'username' : Username,
  'created_at' : Time,
  'updatedAt' : Time,
  'avatarUrl' : [] | [string],
}
export type Username = string;
export interface Workspace {
  'activityLog' : ActorMethod<[UUID], ActivityLogOutput>,
  'addBlock' : ActorMethod<[AddBlockInput], AddBlockOutput>,
  'addOwner' : ActorMethod<[Principal], Result_1>,
  'block' : ActorMethod<[UUID, BlockByUuidOptions], BlockByUuidResult>,
  'createPage' : ActorMethod<[CreatePageInput], CreatePageOutput>,
  'deletePage' : ActorMethod<[DeletePageInput], DeletePageOutput>,
  'details' : ActorMethod<[], Result_3>,
  'getCanistergeekInformation' : ActorMethod<
    [GetInformationRequest],
    GetInformationResponse
  >,
  'handleUserEvent' : ActorMethod<[UserEvent], undefined>,
  'join' : ActorMethod<[], Result_2>,
  'members' : ActorMethod<[], MembersOutput>,
  'pageAccessSettings' : ActorMethod<[UUID], PageAccessSettingsOutput>,
  'pages' : ActorMethod<[PagesOptionsArg], PagesOutput>,
  'removeOwner' : ActorMethod<[Principal], Result_1>,
  'saveEvents' : ActorMethod<
    [SaveEventTransactionInput],
    SaveEventTransactionOutput
  >,
  'setPageAccessSettings' : ActorMethod<
    [SetPageAccessInput],
    SetPageAccessOutput
  >,
  'setUserAccessLevelForPage' : ActorMethod<
    [SetUserAccessLevelForPageInput],
    SetUserAccessLevelForPageOutput
  >,
  'settings' : ActorMethod<[], Result>,
  'subscribe' : ActorMethod<[string, [Principal, string]], undefined>,
  'unsubscribe' : ActorMethod<[string, [Principal, string]], undefined>,
  'updateBlock' : ActorMethod<[UpdateBlockInput], UpdateBlockOutput>,
  'updateCanistergeekInformation' : ActorMethod<
    [UpdateInformationRequest],
    undefined
  >,
  'updateSettings' : ActorMethod<[UpdateSettingsInput], UpdateSettingsOutput>,
  'updateUserRole' : ActorMethod<[UpdateUserRoleInput], UpdateUserRoleOutput>,
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
}
export type WorkspaceDescription = string;
export interface WorkspaceInitArgs {
  'owners' : Array<WorkspaceOwner>,
  'owner' : WorkspaceOwner,
  'name' : WorkspaceName,
  'createdAt' : Time,
  'uuid' : UUID,
  'description' : WorkspaceDescription,
  'initialUsers' : Array<[Principal, WorkspaceUser]>,
  'updatedAt' : Time,
  'userIndexCanisterId' : CanisterId,
  'capacity' : bigint,
}
export type WorkspaceName = string;
export type WorkspaceOwner = Principal;
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
  'name' : WorkspaceName,
  'createdAt' : Time,
  'description' : WorkspaceDescription,
  'updatedAt' : Time,
}
export interface _SERVICE extends Workspace {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
