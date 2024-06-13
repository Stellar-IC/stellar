export const idlFactory = ({ IDL }) => {
  const ShareableNode = IDL.Rec();
  const WorkspaceOwner = IDL.Principal;
  const WorkspaceName = IDL.Text;
  const Time = IDL.Int;
  const UUID = IDL.Vec(IDL.Nat8);
  const WorkspaceDescription = IDL.Text;
  const CanisterId = IDL.Principal;
  const WorkspaceInitArgs = IDL.Record({
    'owners' : IDL.Vec(WorkspaceOwner),
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
    'userIndexCanisterId' : CanisterId,
    'capacity' : IDL.Nat,
  });
  const ActivityId = IDL.Nat;
  const NodeBoundary = IDL.Nat16;
  const NodeDepth = IDL.Nat16;
  const AllocationStrategy = IDL.Variant({
    'boundaryPlus' : IDL.Null,
    'boundaryMinus' : IDL.Null,
  });
  const NodeValue = IDL.Text;
  const NodeBase = IDL.Nat16;
  const NodeIndex = IDL.Nat16;
  const NodeIdentifier = IDL.Vec(NodeIndex);
  ShareableNode.fill(
    IDL.Record({
      'value' : NodeValue,
      'base' : NodeBase,
      'children' : IDL.Vec(IDL.Tuple(NodeIndex, ShareableNode)),
      'identifier' : NodeIdentifier,
      'deletedAt' : IDL.Opt(Time),
    })
  );
  const ShareableBlockContent = IDL.Record({
    'boundary' : NodeBoundary,
    'allocationStrategies' : IDL.Vec(IDL.Tuple(NodeDepth, AllocationStrategy)),
    'rootNode' : ShareableNode,
  });
  const BlockType = IDL.Variant({
    'numberedList' : IDL.Null,
    'todoList' : IDL.Null,
    'toggleHeading1' : IDL.Null,
    'toggleHeading2' : IDL.Null,
    'toggleHeading3' : IDL.Null,
    'code' : IDL.Null,
    'heading1' : IDL.Null,
    'heading2' : IDL.Null,
    'heading3' : IDL.Null,
    'page' : IDL.Null,
    'callout' : IDL.Null,
    'quote' : IDL.Null,
    'bulletedList' : IDL.Null,
    'paragraph' : IDL.Null,
  });
  const ShareableBlockText = IDL.Record({
    'boundary' : NodeBoundary,
    'allocationStrategies' : IDL.Vec(IDL.Tuple(NodeDepth, AllocationStrategy)),
    'rootNode' : ShareableNode,
  });
  const ShareableBlockProperties = IDL.Record({
    'title' : IDL.Opt(ShareableBlockText),
    'checked' : IDL.Opt(IDL.Bool),
  });
  const ShareableBlock__1 = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const HydratedEditItemUser = IDL.Record({
    'username' : IDL.Text,
    'canisterId' : IDL.Principal,
  });
  const HydratedEditItem = IDL.Record({
    'startTime' : Time,
    'blockValue' : IDL.Record({
      'after' : ShareableBlock__1,
      'before' : IDL.Opt(ShareableBlock__1),
    }),
    'user' : HydratedEditItemUser,
  });
  const HydratedActivity = IDL.Record({
    'id' : ActivityId,
    'startTime' : Time,
    'endTime' : Time,
    'edits' : IDL.Vec(HydratedEditItem),
    'users' : IDL.Vec(HydratedEditItemUser),
    'blockExternalId' : UUID,
  });
  const Edge_2 = IDL.Record({ 'node' : HydratedActivity });
  const ActivityLogOutput = IDL.Record({ 'edges' : IDL.Vec(Edge_2) });
  const AddBlockUpdateInput = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const AddBlockUpdateOutputResult = IDL.Null;
  const AddBlockUpdateOutputError = IDL.Variant({ 'unauthorized' : IDL.Null });
  const AddBlockUpdateOutput = IDL.Variant({
    'ok' : AddBlockUpdateOutputResult,
    'err' : AddBlockUpdateOutputError,
  });
  const Result = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({
      'unauthorized' : IDL.Null,
      'userUpdateFailure' : IDL.Null,
    }),
  });
  const WorkspaceUserRole = IDL.Variant({
    'member' : IDL.Null,
    'admin' : IDL.Null,
    'moderator' : IDL.Null,
    'guest' : IDL.Null,
  });
  const WorkspaceUser = IDL.Record({
    'username' : IDL.Text,
    'role' : WorkspaceUserRole,
    'identity' : IDL.Principal,
    'canisterId' : IDL.Principal,
  });
  const AddUsersUpdateInput = IDL.Vec(IDL.Tuple(IDL.Principal, WorkspaceUser));
  const AddUsersUpdateResult = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const BlockByUuidOptions = IDL.Record({
    'contentPagination' : IDL.Record({ 'cursor' : IDL.Nat, 'limit' : IDL.Nat }),
  });
  const ExternalId = IDL.Text;
  const ShareableBlock = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const BlockByUuidResult = IDL.Variant({
    'ok' : IDL.Record({
      'block' : ExternalId,
      'recordMap' : IDL.Record({
        'blocks' : IDL.Vec(IDL.Tuple(ExternalId, ShareableBlock)),
      }),
    }),
    'err' : IDL.Variant({ 'notFound' : IDL.Null }),
  });
  const ShareableBlockProperties__1 = IDL.Record({
    'title' : IDL.Opt(ShareableBlockText),
    'checked' : IDL.Opt(IDL.Bool),
  });
  const CreatePageUpdateInput = IDL.Record({
    'initialBlockUuid' : IDL.Opt(UUID),
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'properties' : ShareableBlockProperties__1,
    'parent' : IDL.Opt(UUID),
  });
  const CreatePageUpdateOutputResult = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const CreatePageUpdateOutputError = IDL.Variant({
    'failedToCreate' : IDL.Null,
    'anonymousUser' : IDL.Null,
    'invalidBlockType' : IDL.Null,
    'insufficientCycles' : IDL.Null,
    'inputTooLong' : IDL.Null,
  });
  const CreatePageUpdateOutput = IDL.Variant({
    'ok' : CreatePageUpdateOutputResult,
    'err' : CreatePageUpdateOutputError,
  });
  const DeletePageUpdateInput = IDL.Record({ 'uuid' : UUID });
  const DeletePageUpdateOutputResult = IDL.Null;
  const DeletePageUpdateOutputError = IDL.Null;
  const DeletePageUpdateOutput = IDL.Variant({
    'ok' : DeletePageUpdateOutputResult,
    'err' : DeletePageUpdateOutputError,
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
  const GetInitArgsOutput = IDL.Variant({
    'ok' : WorkspaceInitArgs,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const Result_1 = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({
      'profileQueryFailure' : IDL.Null,
      'unauthorized' : IDL.Null,
      'userUpdateFailure' : IDL.Null,
    }),
  });
  const Edge_1 = IDL.Record({ 'node' : IDL.Principal });
  const PaginatedResults_1 = IDL.Record({ 'edges' : IDL.Vec(Edge_1) });
  const MembersOutput = IDL.Record({
    'users' : PaginatedResults_1,
    'recordMap' : IDL.Record({
      'users' : IDL.Vec(IDL.Tuple(IDL.Principal, WorkspaceUser)),
    }),
  });
  const SortDirection = IDL.Variant({ 'asc' : IDL.Null, 'desc' : IDL.Null });
  const SortOrder = IDL.Record({
    'direction' : SortDirection,
    'fieldName' : IDL.Text,
  });
  const PrimaryKey = IDL.Nat;
  const PagesOptionsArg = IDL.Record({
    'order' : IDL.Opt(SortOrder),
    'cursor' : IDL.Opt(PrimaryKey),
    'limit' : IDL.Opt(IDL.Nat),
  });
  const Edge = IDL.Record({ 'node' : ExternalId });
  const PaginatedResults = IDL.Record({ 'edges' : IDL.Vec(Edge) });
  const PagesOutput = IDL.Record({
    'pages' : PaginatedResults,
    'recordMap' : IDL.Record({
      'blocks' : IDL.Vec(IDL.Tuple(ExternalId, ShareableBlock)),
    }),
  });
  const BlockCreatedEventData = IDL.Record({
    'block' : IDL.Record({
      'uuid' : UUID,
      'blockType' : BlockType,
      'parent' : IDL.Opt(UUID),
    }),
    'index' : IDL.Nat,
  });
  const BlockPropertyCheckedUpdatedEventData = IDL.Record({
    'checked' : IDL.Bool,
    'blockExternalId' : UUID,
  });
  const BlockBlockTypeUpdatedEventData = IDL.Record({
    'blockType' : BlockType,
    'blockExternalId' : UUID,
  });
  const TreeEvent = IDL.Variant({
    'delete' : IDL.Record({
      'transactionType' : IDL.Variant({ 'delete' : IDL.Null }),
      'position' : NodeIdentifier,
    }),
    'insert' : IDL.Record({
      'transactionType' : IDL.Variant({ 'insert' : IDL.Null }),
      'value' : NodeValue,
      'position' : NodeIdentifier,
    }),
  });
  const BlockContentUpdatedEventData = IDL.Record({
    'transaction' : IDL.Vec(TreeEvent),
    'blockExternalId' : UUID,
  });
  const BlockParentUpdatedEventData = IDL.Record({
    'parentBlockExternalId' : UUID,
    'blockExternalId' : UUID,
  });
  const BlockPropertyTitleUpdatedEventData = IDL.Record({
    'transaction' : IDL.Vec(TreeEvent),
    'blockExternalId' : UUID,
  });
  const BlockUpdatedEventData = IDL.Variant({
    'updatePropertyChecked' : BlockPropertyCheckedUpdatedEventData,
    'updateBlockType' : BlockBlockTypeUpdatedEventData,
    'updateContent' : BlockContentUpdatedEventData,
    'updateParent' : BlockParentUpdatedEventData,
    'updatePropertyTitle' : BlockPropertyTitleUpdatedEventData,
  });
  const BlockEvent = IDL.Record({
    'data' : IDL.Variant({
      'blockCreated' : BlockCreatedEventData,
      'blockUpdated' : BlockUpdatedEventData,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
    'timestamp' : Time,
  });
  const BlockEventTransaction = IDL.Vec(BlockEvent);
  const SaveEventTransactionUpdateInput = IDL.Record({
    'transaction' : BlockEventTransaction,
  });
  const SaveEventTransactionUpdateOutputResult = IDL.Null;
  const SaveEventTransactionUpdateOutputError = IDL.Variant({
    'anonymousUser' : IDL.Null,
    'insufficientCycles' : IDL.Null,
  });
  const SaveEventTransactionUpdateOutput = IDL.Variant({
    'ok' : SaveEventTransactionUpdateOutputResult,
    'err' : SaveEventTransactionUpdateOutputError,
  });
  const WorkspaceVisibility = IDL.Variant({
    'Private' : IDL.Null,
    'Public' : IDL.Null,
  });
  const SettingsOutput = IDL.Record({
    'websiteLink' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'visibility' : WorkspaceVisibility,
  });
  const PubSubEvent = IDL.Variant({
    'workspaceNameUpdated' : IDL.Record({
      'name' : IDL.Text,
      'workspaceId' : IDL.Principal,
    }),
  });
  const PubSubEventHandler = IDL.Func([IDL.Text, PubSubEvent], [], []);
  const Workspace__1 = IDL.Record({
    'name' : WorkspaceName,
    'createdAt' : Time,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
  });
  const UpdateBlockUpdateInput = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const UpdateBlockUpdateOutputResult = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const UpdateBlockUpdateOutputError = IDL.Variant({
    'primaryKeyAttrNotFound' : IDL.Null,
  });
  const UpdateBlockUpdateOutput = IDL.Variant({
    'ok' : UpdateBlockUpdateOutputResult,
    'err' : UpdateBlockUpdateOutputError,
  });
  const CollectMetricsRequestType = IDL.Variant({
    'force' : IDL.Null,
    'normal' : IDL.Null,
  });
  const UpdateInformationRequest = IDL.Record({
    'metrics' : IDL.Opt(CollectMetricsRequestType),
  });
  const UpdateSettingsUpdateInput = IDL.Record({
    'websiteLink' : IDL.Opt(IDL.Text),
    'name' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'visibility' : IDL.Opt(WorkspaceVisibility),
  });
  const UpdateSettingsUpdateOutputOk = IDL.Null;
  const UpdateSettingsUpdateOutputError = IDL.Variant({
    'unauthorized' : IDL.Null,
  });
  const UpdateSettingsUpdateOutput = IDL.Variant({
    'ok' : UpdateSettingsUpdateOutputOk,
    'err' : UpdateSettingsUpdateOutputError,
  });
  const UpdateUserRoleUpdateInput = IDL.Record({
    'role' : WorkspaceUserRole,
    'user' : IDL.Principal,
  });
  const UpdateUserRoleUpdateOutputOk = IDL.Null;
  const UpdateUserRoleUpdateOutputError = IDL.Variant({
    'unauthorized' : IDL.Null,
  });
  const UpdateUserRoleUpdateOutput = IDL.Variant({
    'ok' : UpdateUserRoleUpdateOutputOk,
    'err' : UpdateUserRoleUpdateOutputError,
  });
  const Workspace = IDL.Service({
    'activityLog' : IDL.Func([UUID], [ActivityLogOutput], ['query']),
    'addBlock' : IDL.Func([AddBlockUpdateInput], [AddBlockUpdateOutput], []),
    'addOwner' : IDL.Func([IDL.Principal], [Result], []),
    'addUsers' : IDL.Func([AddUsersUpdateInput], [AddUsersUpdateResult], []),
    'block' : IDL.Func(
        [UUID, BlockByUuidOptions],
        [BlockByUuidResult],
        ['query'],
      ),
    'createPage' : IDL.Func(
        [CreatePageUpdateInput],
        [CreatePageUpdateOutput],
        [],
      ),
    'deletePage' : IDL.Func(
        [DeletePageUpdateInput],
        [DeletePageUpdateOutput],
        [],
      ),
    'getCanistergeekInformation' : IDL.Func(
        [GetInformationRequest],
        [GetInformationResponse],
        ['query'],
      ),
    'getInitArgs' : IDL.Func([], [GetInitArgsOutput], ['query']),
    'join' : IDL.Func([], [Result_1], []),
    'members' : IDL.Func([], [MembersOutput], ['query']),
    'pages' : IDL.Func([PagesOptionsArg], [PagesOutput], ['query']),
    'removeOwner' : IDL.Func([IDL.Principal], [Result], []),
    'saveEvents' : IDL.Func(
        [SaveEventTransactionUpdateInput],
        [SaveEventTransactionUpdateOutput],
        [],
      ),
    'settings' : IDL.Func([], [SettingsOutput], ['query']),
    'subscribe' : IDL.Func([IDL.Text, PubSubEventHandler], [], []),
    'toObject' : IDL.Func([], [Workspace__1], ['query']),
    'updateBlock' : IDL.Func(
        [UpdateBlockUpdateInput],
        [UpdateBlockUpdateOutput],
        [],
      ),
    'updateCanistergeekInformation' : IDL.Func(
        [UpdateInformationRequest],
        [],
        [],
      ),
    'updateSettings' : IDL.Func(
        [UpdateSettingsUpdateInput],
        [UpdateSettingsUpdateOutput],
        [],
      ),
    'updateUserRole' : IDL.Func(
        [UpdateUserRoleUpdateInput],
        [UpdateUserRoleUpdateOutput],
        [],
      ),
    'walletReceive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
  });
  return Workspace;
};
export const init = ({ IDL }) => {
  const WorkspaceOwner = IDL.Principal;
  const WorkspaceName = IDL.Text;
  const Time = IDL.Int;
  const UUID = IDL.Vec(IDL.Nat8);
  const WorkspaceDescription = IDL.Text;
  const CanisterId = IDL.Principal;
  const WorkspaceInitArgs = IDL.Record({
    'owners' : IDL.Vec(WorkspaceOwner),
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
    'userIndexCanisterId' : CanisterId,
    'capacity' : IDL.Nat,
  });
  return [WorkspaceInitArgs];
};
