import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

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
export type CheckUsernameError = { 'UsernameTaken' : null };
export type CheckUsernameResult = { 'ok' : null } |
  { 'err' : CheckUsernameError };
export type CollectMetricsRequestType = { 'force' : null } |
  { 'normal' : null };
export interface DailyMetricsData {
  'updateCalls' : bigint,
  'canisterHeapMemorySize' : NumericEntity,
  'canisterCycles' : NumericEntity,
  'canisterMemorySize' : NumericEntity,
  'timeMillis' : bigint,
}
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
export interface LogMessagesData { 'timeNanos' : Nanos, 'message' : string }
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export interface MetricsRequest { 'parameters' : GetMetricsParameters }
export interface MetricsResponse { 'metrics' : [] | [CanisterMetrics] }
export type Nanos = bigint;
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export interface ProfileUpdatedEventData { 'profile' : UserProfile }
export type RegisterUserError = {
    'WorkspaceCreationFailed' : { 'InsufficientCycles' : null } |
      { 'AnonymousOwner' : null }
  } |
  { 'InsufficientCycles' : null } |
  {
    'UserWorkspaceAssignmentFailed' : { 'InsufficientCycles' : null } |
      { 'AnonymousOwner' : null }
  } |
  { 'WorkspaceIndexNotFound' : null } |
  { 'AnonymousOwner' : null } |
  { 'LoginDisabled' : null };
export type RegisterUserResult = { 'ok' : Principal } |
  { 'err' : RegisterUserError };
export type Result = { 'ok' : { 'accepted' : bigint } } |
  { 'err' : { 'unauthorized' : null } };
export type Result_1 = { 'ok' : Principal } |
  { 'err' : { 'userNotFound' : null } };
export type Result_2 = { 'ok' : null } |
  { 'err' : { 'unauthorized' : null } };
export type Result_3 = { 'ok' : null } |
  {
    'err' : { 'unauthorized' : null } |
      { 'workspaceNotFound' : string } |
      { 'failed' : string }
  };
export type Result_4 = { 'ok' : { 'accepted' : bigint } } |
  { 'err' : { 'userNotFound' : null } | { 'unauthorized' : null } };
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
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UpdateInformationRequest {
  'metrics' : [] | [CollectMetricsRequestType],
}
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
export interface _SERVICE {
  'checkUsername' : ActorMethod<[string], CheckUsernameResult>,
  'disableLogin' : ActorMethod<[], Result_2>,
  'enableLogin' : ActorMethod<[], Result_2>,
  'getCanistergeekInformation' : ActorMethod<
    [GetInformationRequest],
    GetInformationResponse
  >,
  'onUserEvent' : ActorMethod<[UserEvent], undefined>,
  'registerUser' : ActorMethod<[], RegisterUserResult>,
  'requestCycles' : ActorMethod<[bigint], Result_4>,
  'settings' : ActorMethod<[], { 'loginDisabled' : boolean }>,
  'updateCanistergeekInformation' : ActorMethod<
    [UpdateInformationRequest],
    undefined
  >,
  'upgradePersonalWorkspaces' : ActorMethod<[Uint8Array | number[]], Result_3>,
  'upgradeUsers' : ActorMethod<[Uint8Array | number[]], Result_2>,
  'userId' : ActorMethod<[Principal], Result_1>,
  'walletReceive' : ActorMethod<[], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
