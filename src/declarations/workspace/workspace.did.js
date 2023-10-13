export const idlFactory = ({ IDL }) => {
  const ShareableNode = IDL.Rec();
  const UUID = IDL.Vec(IDL.Nat8);
  const BlockContent = IDL.Vec(UUID);
  const BlockType = IDL.Variant({
    'heading1' : IDL.Null,
    'heading2' : IDL.Null,
    'heading3' : IDL.Null,
    'page' : IDL.Null,
    'paragraph' : IDL.Null,
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
  const Time = IDL.Int;
  ShareableNode.fill(
    IDL.Record({
      'value' : NodeValue,
      'base' : NodeBase,
      'children' : IDL.Vec(IDL.Tuple(NodeIndex, ShareableNode)),
      'identifier' : NodeIdentifier,
      'deletedAt' : IDL.Opt(Time),
    })
  );
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
    'content' : BlockContent,
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
  const ShareableBlock = IDL.Record({
    'id' : PrimaryKey,
    'content' : BlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const Result_1 = IDL.Variant({
    'ok' : ShareableBlock,
    'err' : IDL.Variant({ 'blockNotFound' : IDL.Null }),
  });
  const ShareableBlockProperties__1 = IDL.Record({
    'title' : IDL.Opt(ShareableBlockText),
    'checked' : IDL.Opt(IDL.Bool),
  });
  const CreatePageUpdateInput = IDL.Record({
    'content' : BlockContent,
    'uuid' : UUID,
    'properties' : ShareableBlockProperties__1,
    'parent' : IDL.Opt(UUID),
  });
  const CreatePageUpdateOutputResult = IDL.Record({
    'id' : PrimaryKey,
    'content' : BlockContent,
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
    'ok' : ShareableBlock,
    'err' : IDL.Variant({ 'pageNotFound' : IDL.Null }),
  });
  const SortDirection = IDL.Variant({ 'asc' : IDL.Null, 'desc' : IDL.Null });
  const SortOrder = IDL.Record({
    'direction' : SortDirection,
    'fieldName' : IDL.Text,
  });
  const PrimaryKey__1 = IDL.Nat;
  const Edge = IDL.Record({ 'node' : ShareableBlock });
  const PaginatedResults = IDL.Record({ 'edges' : IDL.Vec(Edge) });
  const RemoveBlockUpdateInput = IDL.Record({ 'uuid' : UUID });
  const RemoveBlockUpdateOutputResult = IDL.Null;
  const RemoveBlockUpdateOutputError = IDL.Null;
  const RemoveBlockUpdateOutput = IDL.Variant({
    'ok' : RemoveBlockUpdateOutputResult,
    'err' : RemoveBlockUpdateOutputError,
  });
  const BlockRemovedEvent = IDL.Record({
    'data' : IDL.Record({ 'blockExternalId' : UUID, 'parent' : UUID }),
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
  const BlockUpdatedEvent = IDL.Variant({
    'updateBlockType' : IDL.Record({
      'data' : IDL.Record({
        'blockType' : BlockType,
        'blockExternalId' : UUID,
      }),
      'user' : IDL.Principal,
      'uuid' : UUID,
    }),
    'updatePropertyTitle' : IDL.Record({
      'data' : IDL.Record({ 'event' : TreeEvent, 'blockExternalId' : UUID }),
      'user' : IDL.Principal,
      'uuid' : UUID,
    }),
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
  const UpdateBlockUpdateInput = IDL.Record({
    'id' : PrimaryKey,
    'content' : BlockContent,
    'uuid' : UUID,
    'blockType' : BlockType,
    'properties' : ShareableBlockProperties,
    'parent' : IDL.Opt(UUID),
  });
  const UpdateBlockUpdateOutputResult = IDL.Record({
    'id' : PrimaryKey,
    'content' : BlockContent,
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
    'getInitArgs' : IDL.Func(
        [],
        [
          IDL.Record({
            'ownerPrincipal' : IDL.Principal,
            'workspaceIndexPrincipal' : IDL.Principal,
            'capacity' : IDL.Nat,
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
    'updateBlock' : IDL.Func(
        [UpdateBlockUpdateInput],
        [UpdateBlockUpdateOutput],
        [],
      ),
  });
  return Workspace;
};
export const init = ({ IDL }) => {
  return [
    IDL.Record({
      'ownerPrincipal' : IDL.Principal,
      'workspaceIndexPrincipal' : IDL.Principal,
      'capacity' : IDL.Nat,
    }),
  ];
};
