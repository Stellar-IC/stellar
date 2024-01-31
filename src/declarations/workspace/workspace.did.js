export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const ShareableNode = IDL.Rec();
  const WorkspaceInitArgs = IDL.Record({
    'owner' : IDL.Principal,
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
  const AddBlockUpdateInput = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const PrimaryKey__1 = IDL.Nat;
  const AddBlockUpdateOutputResult = IDL.Record({ 'id' : PrimaryKey__1 });
  const AddBlockUpdateOutputError = IDL.Null;
  const AddBlockUpdateOutput = IDL.Variant({
    'ok' : AddBlockUpdateOutputResult,
    'err' : AddBlockUpdateOutputError,
  });
  const PrimaryKey = IDL.Nat;
  const ShareableBlock = IDL.Record({
    'id' : PrimaryKey,
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const BlockByUuidResult = IDL.Variant({
    'ok' : ShareableBlock,
    'err' : IDL.Variant({ 'blockNotFound' : IDL.Null }),
  });
  const ShareableBlock__1 = IDL.Record({
    'id' : PrimaryKey,
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  List.fill(IDL.Opt(IDL.Tuple(ShareableBlock__1, List)));
  const ShareableBlockProperties__1 = IDL.Record({
    'title' : IDL.Opt(ShareableBlockText),
    'checked' : IDL.Opt(IDL.Bool),
  });
  const CreatePageUpdateInput = IDL.Record({
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'properties' : ShareableBlockProperties__1,
    'parent' : IDL.Opt(UUID),
  });
  const CreatePageUpdateOutputResult = IDL.Record({
    'id' : PrimaryKey,
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
  const Result_1 = IDL.Variant({
    'ok' : GetInformationResponse,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const PageByUuidResult = IDL.Variant({
    'ok' : ShareableBlock,
    'err' : IDL.Variant({ 'pageNotFound' : IDL.Null }),
  });
  const SortDirection = IDL.Variant({ 'asc' : IDL.Null, 'desc' : IDL.Null });
  const SortOrder = IDL.Record({
    'direction' : SortDirection,
    'fieldName' : IDL.Text,
  });
  const PagesOptionsArg = IDL.Record({
    'order' : IDL.Opt(SortOrder),
    'cursor' : IDL.Opt(PrimaryKey__1),
    'limit' : IDL.Opt(IDL.Nat),
  });
  const Edge = IDL.Record({ 'node' : ShareableBlock });
  const PagesResult = IDL.Record({ 'edges' : IDL.Vec(Edge) });
  const BlockCreatedEvent = IDL.Record({
    'data' : IDL.Record({
      'block' : IDL.Record({
        'uuid' : UUID,
        'blockType' : BlockType,
        'parent' : IDL.Opt(UUID),
      }),
      'index' : IDL.Nat,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
  });
  const BlockProperyCheckedUpdatedEvent = IDL.Record({
    'data' : IDL.Record({ 'checked' : IDL.Bool, 'blockExternalId' : UUID }),
    'user' : IDL.Principal,
    'uuid' : UUID,
  });
  const BlockTypeUpdatedEvent = IDL.Record({
    'data' : IDL.Record({ 'blockType' : BlockType, 'blockExternalId' : UUID }),
    'user' : IDL.Principal,
    'uuid' : UUID,
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
  const BlockContentUpdatedEvent = IDL.Record({
    'data' : IDL.Record({
      'transaction' : IDL.Vec(TreeEvent),
      'blockExternalId' : UUID,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
  });
  const BlockParentUpdatedEvent = IDL.Record({
    'data' : IDL.Record({
      'parentBlockExternalId' : UUID,
      'blockExternalId' : UUID,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
  });
  const BlockProperyTitleUpdatedEvent = IDL.Record({
    'data' : IDL.Record({
      'transaction' : IDL.Vec(TreeEvent),
      'blockExternalId' : UUID,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
  });
  const BlockUpdatedEvent = IDL.Variant({
    'updatePropertyChecked' : BlockProperyCheckedUpdatedEvent,
    'updateBlockType' : BlockTypeUpdatedEvent,
    'updateContent' : BlockContentUpdatedEvent,
    'updateParent' : BlockParentUpdatedEvent,
    'updatePropertyTitle' : BlockProperyTitleUpdatedEvent,
  });
  const BlockEvent = IDL.Variant({
    'blockCreated' : BlockCreatedEvent,
    'empty' : IDL.Null,
    'blockUpdated' : BlockUpdatedEvent,
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
  const WorkspaceOwner = IDL.Principal;
  const Workspace__1 = IDL.Record({
    'owner' : WorkspaceOwner,
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
  });
  const UpdateBlockUpdateInput = IDL.Record({
    'id' : PrimaryKey,
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const UpdateBlockUpdateOutputResult = IDL.Record({
    'id' : PrimaryKey,
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
  const Result = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const Workspace = IDL.Service({
    'addBlock' : IDL.Func([AddBlockUpdateInput], [AddBlockUpdateOutput], []),
    'blockByUuid' : IDL.Func([UUID], [BlockByUuidResult], ['query']),
    'blocksByPageUuid' : IDL.Func([IDL.Text], [List], ['query']),
    'createPage' : IDL.Func(
        [CreatePageUpdateInput],
        [CreatePageUpdateOutput],
        [],
      ),
    'cyclesInformation' : IDL.Func(
        [],
        [IDL.Record({ 'balance' : IDL.Nat, 'capacity' : IDL.Nat })],
        [],
      ),
    'deletePage' : IDL.Func(
        [DeletePageUpdateInput],
        [DeletePageUpdateOutput],
        [],
      ),
    'getCanistergeekInformation' : IDL.Func(
        [GetInformationRequest],
        [Result_1],
        ['query'],
      ),
    'getInitArgs' : IDL.Func(
        [],
        [IDL.Record({ 'owner' : IDL.Principal, 'capacity' : IDL.Nat })],
        [],
      ),
    'getInitData' : IDL.Func(
        [],
        [
          IDL.Record({
            'name' : WorkspaceName,
            'createdAt' : Time,
            'uuid' : UUID,
            'description' : WorkspaceDescription,
            'updatedAt' : Time,
          }),
        ],
        [],
      ),
    'pageByUuid' : IDL.Func([UUID], [PageByUuidResult], ['query']),
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
        [Result],
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
  const WorkspaceInitArgs = IDL.Record({
    'owner' : IDL.Principal,
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
