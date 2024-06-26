export const idlFactory = ({ IDL }) => {
  const CheckUsernameError = IDL.Variant({ 'UsernameTaken' : IDL.Null });
  const CheckUsernameResult = IDL.Variant({
    'ok' : IDL.Null,
    'err' : CheckUsernameError,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
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
  const Username = IDL.Text;
  const Time = IDL.Int;
  const UserProfile = IDL.Record({
    'username' : Username,
    'created_at' : Time,
    'updatedAt' : Time,
    'avatarUrl' : IDL.Opt(IDL.Text),
  });
  const ProfileUpdatedEventData = IDL.Record({ 'profile' : UserProfile });
  const UserEvent = IDL.Record({
    'userId' : IDL.Principal,
    'event' : IDL.Variant({ 'profileUpdated' : ProfileUpdatedEventData }),
  });
  const RegisterUserError = IDL.Variant({
    'WorkspaceCreationFailed' : IDL.Variant({
      'InsufficientCycles' : IDL.Null,
      'AnonymousOwner' : IDL.Null,
    }),
    'InsufficientCycles' : IDL.Null,
    'UserWorkspaceAssignmentFailed' : IDL.Variant({
      'InsufficientCycles' : IDL.Null,
      'AnonymousOwner' : IDL.Null,
    }),
    'WorkspaceIndexNotFound' : IDL.Null,
    'AnonymousOwner' : IDL.Null,
    'LoginDisabled' : IDL.Null,
  });
  const RegisterUserResult = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : RegisterUserError,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Record({ 'accepted' : IDL.Nat64 }),
    'err' : IDL.Variant({
      'userNotFound' : IDL.Null,
      'unauthorized' : IDL.Null,
    }),
  });
  const CollectMetricsRequestType = IDL.Variant({
    'force' : IDL.Null,
    'normal' : IDL.Null,
  });
  const UpdateInformationRequest = IDL.Record({
    'metrics' : IDL.Opt(CollectMetricsRequestType),
  });
  const UserDetailsByIdentityResult = IDL.Variant({
    'ok' : IDL.Record({ 'username' : IDL.Text, 'canisterId' : IDL.Principal }),
    'err' : IDL.Variant({ 'userNotFound' : IDL.Null }),
  });
  const Result_1 = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : IDL.Variant({ 'userNotFound' : IDL.Null }),
  });
  const Result = IDL.Variant({
    'ok' : IDL.Record({ 'accepted' : IDL.Nat64 }),
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  return IDL.Service({
    'checkUsername' : IDL.Func([IDL.Text], [CheckUsernameResult], ['query']),
    'disableLogin' : IDL.Func([], [Result_2], []),
    'enableLogin' : IDL.Func([], [Result_2], []),
    'getCanistergeekInformation' : IDL.Func(
        [GetInformationRequest],
        [GetInformationResponse],
        ['query'],
      ),
    'onUserEvent' : IDL.Func([UserEvent], [], []),
    'registerUser' : IDL.Func([], [RegisterUserResult], []),
    'requestCycles' : IDL.Func([IDL.Nat], [Result_3], []),
    'settings' : IDL.Func(
        [],
        [IDL.Record({ 'loginDisabled' : IDL.Bool })],
        ['query'],
      ),
    'updateCanistergeekInformation' : IDL.Func(
        [UpdateInformationRequest],
        [],
        [],
      ),
    'upgradeUser' : IDL.Func(
        [IDL.Principal, IDL.Vec(IDL.Nat8)],
        [Result_2],
        [],
      ),
    'upgradeUsers' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result_2], []),
    'userDetailsByIdentity' : IDL.Func(
        [IDL.Principal],
        [UserDetailsByIdentityResult],
        ['query'],
      ),
    'userId' : IDL.Func([IDL.Principal], [Result_1], ['query']),
    'walletReceive' : IDL.Func([], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
