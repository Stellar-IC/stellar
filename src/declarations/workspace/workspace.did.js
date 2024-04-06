export const idlFactory = ({ IDL }) => {
  const ShareableNode = IDL.Rec();
  const WorkspaceOwner = IDL.Principal;
  const WorkspaceInitArgs = IDL.Record({
    'owner' : WorkspaceOwner,
    'capacity' : IDL.Nat,
  });
  const WorkspaceName = IDL.Text;
  const Time = IDL.Int;
  const UUID = IDL.Vec(IDL.Nat8);
  const WorkspaceDescription = IDL.Text;
  const WorkspaceInitData = IDL.Record({
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
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
    'toggleList' : IDL.Null,
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
  const Edge_1 = IDL.Record({ 'node' : HydratedActivity });
  const ActivityLogOutput = IDL.Record({ 'edges' : IDL.Vec(Edge_1) });
  const ShareableBlockContent__1 = IDL.Record({
    'boundary' : NodeBoundary,
    'allocationStrategies' : IDL.Vec(IDL.Tuple(NodeDepth, AllocationStrategy)),
    'rootNode' : ShareableNode,
  });
  const BlockType__2 = IDL.Variant({
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
    'toggleList' : IDL.Null,
  });
  const ShareableBlockProperties__2 = IDL.Record({
    'title' : IDL.Opt(ShareableBlockText),
    'checked' : IDL.Opt(IDL.Bool),
  });
  const AddBlockUpdateInput = IDL.Record({
    'content' : ShareableBlockContent__1,
    'uuid' : UUID,
    'blockType' : BlockType__2,
    'properties' : ShareableBlockProperties__2,
    'parent' : IDL.Opt(UUID),
  });
  const AddBlockUpdateOutputResult = IDL.Null;
  const AddBlockUpdateOutputError = IDL.Variant({ 'unauthorized' : IDL.Null });
  const AddBlockUpdateOutput = IDL.Variant({
    'ok' : AddBlockUpdateOutputResult,
    'err' : AddBlockUpdateOutputError,
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
    'content' : ShareableBlockContent__1,
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
  const WorkspaceOwner__1 = IDL.Principal;
  const WorkspaceInitArgs__1 = IDL.Record({
    'owner' : WorkspaceOwner__1,
    'capacity' : IDL.Nat,
  });
  const GetInitArgsOutput = IDL.Variant({
    'ok' : WorkspaceInitArgs__1,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const WorkspaceInitData__1 = IDL.Record({
    'name' : IDL.Text,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : IDL.Text,
    'updatedAt' : Time,
  });
  const GetInitDataOutput = IDL.Variant({
    'ok' : WorkspaceInitData__1,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
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
  const PagesResult = IDL.Record({
    'pages' : PaginatedResults,
    'recordMap' : IDL.Record({
      'blocks' : IDL.Vec(IDL.Tuple(ExternalId, ShareableBlock)),
    }),
  });
  const BlockType__1 = IDL.Variant({
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
    'toggleList' : IDL.Null,
  });
  const BlockCreatedEventData = IDL.Record({
    'block' : IDL.Record({
      'uuid' : UUID,
      'blockType' : BlockType__1,
      'parent' : IDL.Opt(UUID),
    }),
    'index' : IDL.Nat,
  });
  const BlockPropertyCheckedUpdatedEventData = IDL.Record({
    'checked' : IDL.Bool,
    'blockExternalId' : UUID,
  });
  const BlockBlockTypeUpdatedEventData = IDL.Record({
    'blockType' : BlockType__1,
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
  const Workspace__1 = IDL.Record({
    'owner' : WorkspaceOwner,
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
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
  const Workspace = IDL.Service({
    'activityLog' : IDL.Func([UUID], [ActivityLogOutput], ['query']),
    'addBlock' : IDL.Func([AddBlockUpdateInput], [AddBlockUpdateOutput], []),
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
    'getInitData' : IDL.Func([], [GetInitDataOutput], ['query']),
    'pages' : IDL.Func([PagesOptionsArg], [PagesResult], ['query']),
    'saveEvents' : IDL.Func(
        [SaveEventTransactionUpdateInput],
        [SaveEventTransactionUpdateOutput],
        [],
      ),
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
  const WorkspaceInitArgs = IDL.Record({
    'owner' : WorkspaceOwner,
    'capacity' : IDL.Nat,
  });
  const WorkspaceName = IDL.Text;
  const Time = IDL.Int;
  const UUID = IDL.Vec(IDL.Nat8);
  const WorkspaceDescription = IDL.Text;
  const WorkspaceInitData = IDL.Record({
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
  });
  return [WorkspaceInitArgs, WorkspaceInitData];
};
