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
export interface ProfileInput { 'username' : Username }
export interface ProfileUpdatedEventData { 'profile' : UserProfile }
export interface PublicUserProfile {
  'username' : string,
  'avatarUrl' : [] | [string],
}
export type Result = { 'ok' : Array<WorkspaceId> } |
  { 'err' : { 'unauthorized' : null } };
export type Result_1 = { 'ok' : { 'accepted' : bigint } } |
  { 'err' : { 'unauthorized' : null } };
export type Result_2 = { 'ok' : UserProfile } |
  { 'err' : { 'unauthorized' : null } | { 'usernameTaken' : null } };
export type Result_3 = { 'ok' : null } |
  { 'err' : { 'unauthorized' : null } };
export type Result_4 = { 'ok' : UserProfile } |
  { 'err' : { 'fileUploadError' : string } | { 'unauthorized' : null } };
export type Result_5 = { 'ok' : null } |
  { 'err' : { 'removalPrevented' : null } | { 'unauthorized' : null } };
export type Result_6 = { 'ok' : PublicUserProfile } |
  { 'err' : { 'unauthorized' : null } };
export type Result_7 = { 'ok' : UserProfile } |
  { 'err' : { 'unauthorized' : null } };
export type Result_8 = { 'ok' : [] | [WorkspaceId] } |
  {
    'err' : { 'anonymousUser' : null } |
      { 'insufficientCycles' : null } |
      { 'unauthorized' : null }
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
export type Time = bigint;
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UpdateInformationRequest {
  'metrics' : [] | [CollectMetricsRequestType],
}
export interface User {
  'addWorkspace' : ActorMethod<[{ 'canisterId' : Principal }], Result_3>,
  'getCanistergeekInformation' : ActorMethod<
    [GetInformationRequest],
    GetInformationResponse
  >,
  'personalWorkspace' : ActorMethod<[], Result_8>,
  'profile' : ActorMethod<[], Result_7>,
  'publicProfile' : ActorMethod<[], Result_6>,
  'removeWorkspace' : ActorMethod<[{ 'canisterId' : Principal }], Result_5>,
  'setAvatar' : ActorMethod<
    [
      {
        'content' : Uint8Array | number[],
        'name' : string,
        'content_type' : string,
      },
    ],
    Result_4
  >,
  'setPersonalWorkspace' : ActorMethod<[WorkspaceId], Result_3>,
  'subscribe' : ActorMethod<[UserEventName, [Principal, string]], undefined>,
  'updateCanistergeekInformation' : ActorMethod<
    [UpdateInformationRequest],
    undefined
  >,
  'updateProfile' : ActorMethod<[ProfileInput], Result_2>,
  'walletReceive' : ActorMethod<[], Result_1>,
  'workspaces' : ActorMethod<[], Result>,
}
export interface UserEvent {
  'userId' : Principal,
  'event' : { 'profileUpdated' : ProfileUpdatedEventData },
}
export type UserEventName = { 'profileUpdated' : null };
export type UserEventSubscription = ActorMethod<[UserEvent], undefined>;
export interface UserInitArgs { 'owner' : Principal, 'capacity' : bigint }
export interface UserProfile {
  'username' : Username__1,
  'created_at' : Time,
  'updatedAt' : Time,
  'avatarUrl' : [] | [string],
}
export type Username = string;
export type Username__1 = string;
export type WorkspaceId = Principal;
export interface _SERVICE extends User {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
