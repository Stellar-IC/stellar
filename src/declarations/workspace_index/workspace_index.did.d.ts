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
export type PubSubEvent = {
    'workspaceNameUpdated' : { 'name' : string, 'workspaceId' : Principal }
  };
export type Result = { 'ok' : null } |
  { 'err' : { 'unauthorized' : null } };
export type Result_1 = { 'ok' : Principal } |
  {
    'err' : { 'InsufficientCycles' : null } |
      { 'AnonymousOwner' : null } |
      { 'Unauthorized' : null }
  };
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
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UpdateInformationRequest {
  'metrics' : [] | [CollectMetricsRequestType],
}
export interface WorkspaceDetails { 'name' : string, 'canisterId' : Principal }
export type WorkspaceDetailsByIdOk = Array<WorkspaceDetailsItem>;
export type WorkspaceDetailsByIdOutput = { 'ok' : WorkspaceDetailsByIdOk } |
  { 'err' : { 'workspaceNotFound' : null } };
export interface WorkspaceDetailsItem {
  'id' : Principal,
  'result' : { 'found' : WorkspaceDetails } |
    { 'notFound' : null },
}
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
export interface _SERVICE {
  'createWorkspace' : ActorMethod<
    [
      {
        'name' : string,
        'description' : string,
        'initialUsers' : Array<[Principal, WorkspaceUser]>,
        'additionalOwners' : Array<Principal>,
      },
    ],
    Result_1
  >,
  'getCanistergeekInformation' : ActorMethod<
    [GetInformationRequest],
    GetInformationResponse
  >,
  'handleWorkspaceEvents' : ActorMethod<[string, PubSubEvent], undefined>,
  'removeWorkspace' : ActorMethod<[Principal], Result>,
  'requestCycles' : ActorMethod<[bigint], { 'accepted' : bigint }>,
  'updateCanistergeekInformation' : ActorMethod<
    [UpdateInformationRequest],
    undefined
  >,
  'upgradeWorkspaces' : ActorMethod<[Uint8Array | number[]], Result>,
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
  'workspaceDetailsById' : ActorMethod<
    [Array<Principal>],
    WorkspaceDetailsByIdOutput
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
