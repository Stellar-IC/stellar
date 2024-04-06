export const idlFactory = ({ IDL }) => {
  const UserInitArgs = IDL.Record({
    'owner' : IDL.Principal,
    'capacity' : IDL.Nat,
  });
  const StatusRequest = IDL.Record({
    'memory_size' : IDL.Bool,
    'cycles' : IDL.Bool,
    'heap_memory_size' : IDL.Bool,
  });
  const MetricsGranularity = IDL.Variant({
    'hourly' : IDL.Null,
    'daily' : IDL.Null,
  });
  const GetMetricsParameters = IDL.Record({
    'dateToMillis' : IDL.Nat,
    'granularity' : MetricsGranularity,
    'dateFromMillis' : IDL.Nat,
  });
  const MetricsRequest = IDL.Record({ 'parameters' : GetMetricsParameters });
  const GetLogMessagesFilter = IDL.Record({
    'analyzeCount' : IDL.Nat32,
    'messageRegex' : IDL.Opt(IDL.Text),
    'messageContains' : IDL.Opt(IDL.Text),
  });
  const Nanos = IDL.Nat64;
  const GetLogMessagesParameters = IDL.Record({
    'count' : IDL.Nat32,
    'filter' : IDL.Opt(GetLogMessagesFilter),
    'fromTimeNanos' : IDL.Opt(Nanos),
  });
  const GetLatestLogMessagesParameters = IDL.Record({
    'upToTimeNanos' : IDL.Opt(Nanos),
    'count' : IDL.Nat32,
    'filter' : IDL.Opt(GetLogMessagesFilter),
  });
  const CanisterLogRequest = IDL.Variant({
    'getMessagesInfo' : IDL.Null,
    'getMessages' : GetLogMessagesParameters,
    'getLatestMessages' : GetLatestLogMessagesParameters,
  });
  const GetInformationRequest = IDL.Record({
    'status' : IDL.Opt(StatusRequest),
    'metrics' : IDL.Opt(MetricsRequest),
    'logs' : IDL.Opt(CanisterLogRequest),
    'version' : IDL.Bool,
  });
  const StatusResponse = IDL.Record({
    'memory_size' : IDL.Opt(IDL.Nat64),
    'cycles' : IDL.Opt(IDL.Nat64),
    'heap_memory_size' : IDL.Opt(IDL.Nat64),
  });
  const UpdateCallsAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterHeapMemoryAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterCyclesAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterMemoryAggregatedData = IDL.Vec(IDL.Nat64);
  const HourlyMetricsData = IDL.Record({
    'updateCalls' : UpdateCallsAggregatedData,
    'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
    'canisterCycles' : CanisterCyclesAggregatedData,
    'canisterMemorySize' : CanisterMemoryAggregatedData,
    'timeMillis' : IDL.Int,
  });
  const NumericEntity = IDL.Record({
    'avg' : IDL.Nat64,
    'max' : IDL.Nat64,
    'min' : IDL.Nat64,
    'first' : IDL.Nat64,
    'last' : IDL.Nat64,
  });
  const DailyMetricsData = IDL.Record({
    'updateCalls' : IDL.Nat64,
    'canisterHeapMemorySize' : NumericEntity,
    'canisterCycles' : NumericEntity,
    'canisterMemorySize' : NumericEntity,
    'timeMillis' : IDL.Int,
  });
  const CanisterMetricsData = IDL.Variant({
    'hourly' : IDL.Vec(HourlyMetricsData),
    'daily' : IDL.Vec(DailyMetricsData),
  });
  const CanisterMetrics = IDL.Record({ 'data' : CanisterMetricsData });
  const MetricsResponse = IDL.Record({ 'metrics' : IDL.Opt(CanisterMetrics) });
  const CanisterLogFeature = IDL.Variant({
    'filterMessageByContains' : IDL.Null,
    'filterMessageByRegex' : IDL.Null,
  });
  const CanisterLogMessagesInfo = IDL.Record({
    'features' : IDL.Vec(IDL.Opt(CanisterLogFeature)),
    'lastTimeNanos' : IDL.Opt(Nanos),
    'count' : IDL.Nat32,
    'firstTimeNanos' : IDL.Opt(Nanos),
  });
  const LogMessagesData = IDL.Record({
    'timeNanos' : Nanos,
    'message' : IDL.Text,
  });
  const CanisterLogMessages = IDL.Record({
    'data' : IDL.Vec(LogMessagesData),
    'lastAnalyzedMessageTimeNanos' : IDL.Opt(Nanos),
  });
  const CanisterLogResponse = IDL.Variant({
    'messagesInfo' : CanisterLogMessagesInfo,
    'messages' : CanisterLogMessages,
  });
  const GetInformationResponse = IDL.Record({
    'status' : IDL.Opt(StatusResponse),
    'metrics' : IDL.Opt(MetricsResponse),
    'logs' : IDL.Opt(CanisterLogResponse),
    'version' : IDL.Opt(IDL.Nat),
  });
  const WorkspaceId = IDL.Principal;
  const Result_5 = IDL.Variant({
    'ok' : WorkspaceId,
    'err' : IDL.Variant({
      'anonymousUser' : IDL.Null,
      'insufficientCycles' : IDL.Null,
      'unauthorized' : IDL.Null,
    }),
  });
  const Username__1 = IDL.Text;
  const Time = IDL.Int;
  const UserProfile = IDL.Record({
    'username' : Username__1,
    'created_at' : Time,
    'updatedAt' : Time,
  });
  const Result_4 = IDL.Variant({
    'ok' : UserProfile,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const PublicUserProfile = IDL.Record({
    'username' : IDL.Text,
    'canisterId' : IDL.Principal,
  });
  const Result_3 = IDL.Variant({
    'ok' : PublicUserProfile,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const UserEventName = IDL.Variant({ 'profileUpdated' : IDL.Null });
  const UserEvent = IDL.Record({
    'userId' : IDL.Principal,
    'event' : IDL.Variant({
      'profileUpdated' : IDL.Record({ 'profile' : UserProfile }),
    }),
  });
  const UserEventSubscription = IDL.Func([UserEvent], [], []);
  const CollectMetricsRequestType = IDL.Variant({
    'force' : IDL.Null,
    'normal' : IDL.Null,
  });
  const UpdateInformationRequest = IDL.Record({
    'metrics' : IDL.Opt(CollectMetricsRequestType),
  });
  const Username = IDL.Text;
  const ProfileInput = IDL.Record({ 'username' : Username });
  const Result_2 = IDL.Variant({
    'ok' : UserProfile,
    'err' : IDL.Variant({
      'unauthorized' : IDL.Null,
      'usernameTaken' : IDL.Null,
    }),
  });
  const Result_1 = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({
      'unauthorized' : IDL.Null,
      'workspaceNotFound' : IDL.Text,
      'failed' : IDL.Text,
    }),
  });
  const Result = IDL.Variant({
    'ok' : IDL.Record({ 'accepted' : IDL.Nat64 }),
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const User = IDL.Service({
    'getCanistergeekInformation' : IDL.Func(
        [GetInformationRequest],
        [GetInformationResponse],
        ['query'],
      ),
    'personalWorkspace' : IDL.Func([], [Result_5], []),
    'profile' : IDL.Func([], [Result_4], ['query']),
    'publicProfile' : IDL.Func([], [Result_3], ['query']),
    'subscribe' : IDL.Func([UserEventName, UserEventSubscription], [], []),
    'updateCanistergeekInformation' : IDL.Func(
        [UpdateInformationRequest],
        [],
        [],
      ),
    'updateProfile' : IDL.Func([ProfileInput], [Result_2], []),
    'upgradePersonalWorkspace' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    'walletReceive' : IDL.Func([], [Result], []),
  });
  return User;
};
export const init = ({ IDL }) => {
  const UserInitArgs = IDL.Record({
    'owner' : IDL.Principal,
    'capacity' : IDL.Nat,
  });
  return [UserInitArgs];
};
