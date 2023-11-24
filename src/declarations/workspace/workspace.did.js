export const idlFactory = ({ IDL }) => {
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
  const PrimaryKey__2 = IDL.Nat;
  const AddBlockUpdateOutputResult = IDL.Record({ 'id' : PrimaryKey__2 });
  const AddBlockUpdateOutputError = IDL.Null;
  const AddBlockUpdateOutput = IDL.Variant({
    'ok' : AddBlockUpdateOutputResult,
    'err' : AddBlockUpdateOutputError,
  });
  const PrimaryKey = IDL.Nat;
  const ShareableBlock_v2 = IDL.Record({
    'id' : PrimaryKey,
    'content' : ShareableBlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const Result_1 = IDL.Variant({
    'ok' : ShareableBlock_v2,
    'err' : IDL.Variant({ 'blockNotFound' : IDL.Null }),
  });
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
  const Result = IDL.Variant({
    'ok' : ShareableBlock_v2,
    'err' : IDL.Variant({ 'pageNotFound' : IDL.Null }),
  });
  const SortDirection = IDL.Variant({ 'asc' : IDL.Null, 'desc' : IDL.Null });
  const SortOrder = IDL.Record({
    'direction' : SortDirection,
    'fieldName' : IDL.Text,
  });
  const PrimaryKey__1 = IDL.Nat;
  const Edge = IDL.Record({ 'node' : ShareableBlock_v2 });
  const PaginatedResults = IDL.Record({ 'edges' : IDL.Vec(Edge) });
  const RemoveBlockUpdateInput = IDL.Record({ 'uuid' : UUID });
  const RemoveBlockUpdateOutputResult = IDL.Null;
  const RemoveBlockUpdateOutputError = IDL.Null;
  const RemoveBlockUpdateOutput = IDL.Variant({
    'ok' : RemoveBlockUpdateOutputResult,
    'err' : RemoveBlockUpdateOutputError,
  });
  const BlockRemovedEvent = IDL.Record({
    'data' : IDL.Record({
      'block' : IDL.Record({ 'uuid' : UUID, 'parent' : UUID }),
      'index' : IDL.Nat,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
  });
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
    'data' : IDL.Record({ 'transaction' : IDL.Vec(TreeEvent) }),
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
    'blockRemoved' : BlockRemovedEvent,
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
  const Workspace = IDL.Service({
    'addBlock' : IDL.Func([AddBlockUpdateInput], [AddBlockUpdateOutput], []),
    'blockByUuid' : IDL.Func([UUID], [Result_1], ['query']),
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
    'pageByUuid' : IDL.Func([UUID], [Result], ['query']),
    'pages' : IDL.Func(
        [
          IDL.Record({
            'order' : IDL.Opt(SortOrder),
            'cursor' : IDL.Opt(PrimaryKey__1),
            'limit' : IDL.Opt(IDL.Nat),
          }),
        ],
        [PaginatedResults],
        ['query'],
      ),
    'removeBlock' : IDL.Func(
        [RemoveBlockUpdateInput],
        [RemoveBlockUpdateOutput],
        [],
      ),
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
