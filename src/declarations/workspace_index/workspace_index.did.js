export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : IDL.Variant({
      'anonymousUser' : IDL.Null,
      'anonymousCaller' : IDL.Null,
      'insufficientCycles' : IDL.Null,
      'unauthorizedCaller' : IDL.Null,
    }),
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
  const CollectMetricsRequestType = IDL.Variant({
    'force' : IDL.Null,
    'normal' : IDL.Null,
  });
  const UpdateInformationRequest = IDL.Record({
    'metrics' : IDL.Opt(CollectMetricsRequestType),
  });
  const UUID = IDL.Vec(IDL.Nat8);
  const WorkspaceOwner = IDL.Principal;
  const WorkspaceName = IDL.Text;
  const Time = IDL.Int;
  const WorkspaceDescription = IDL.Text;
  const Workspace = IDL.Record({
    'owner' : WorkspaceOwner,
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
  });
  const Edge = IDL.Record({ 'node' : Workspace });
  const PaginatedResults = IDL.Record({ 'edges' : IDL.Vec(Edge) });
  return IDL.Service({
    'createWorkspace' : IDL.Func(
        [IDL.Record({ 'owner' : IDL.Principal })],
        [Result],
        [],
      ),
    'cyclesInformation' : IDL.Func(
        [],
        [IDL.Record({ 'balance' : IDL.Nat, 'capacity' : IDL.Nat })],
        [],
      ),
    'getCanistergeekInformation' : IDL.Func(
        [GetInformationRequest],
        [GetInformationResponse],
        ['query'],
      ),
    'requestCycles' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'updateCanistergeekInformation' : IDL.Func(
        [UpdateInformationRequest],
        [],
        [],
      ),
    'walletReceive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'workspaceByUuid' : IDL.Func([UUID], [Workspace], []),
    'workspaces' : IDL.Func([IDL.Record({})], [PaginatedResults], []),
  });
};
export const init = ({ IDL }) => { return []; };
