export const idlFactory = ({ IDL }) => {
  const ShareableNode = IDL.Rec();
  const UUID = IDL.Vec(IDL.Nat8);
  const BlockContent = IDL.Vec(UUID);
  const BlockType = IDL.Variant({
    heading1: IDL.Null,
    heading2: IDL.Null,
    heading3: IDL.Null,
    page: IDL.Null,
    paragraph: IDL.Null,
  });
  const NodeBoundary = IDL.Nat16;
  const NodeDepth = IDL.Nat16;
  const AllocationStrategy = IDL.Variant({
    boundaryPlus: IDL.Null,
    boundaryMinus: IDL.Null,
  });
  const NodeValue = IDL.Text;
  const NodeBase = IDL.Nat16;
  const NodeIndex = IDL.Nat16;
  const NodeIdentifier = IDL.Vec(NodeIndex);
  const Time = IDL.Int;
  ShareableNode.fill(
    IDL.Record({
      value: NodeValue,
      base: NodeBase,
      children: IDL.Vec(IDL.Tuple(NodeIndex, ShareableNode)),
      identifier: NodeIdentifier,
      deletedAt: IDL.Opt(Time),
    })
  );
  const ShareableBlockText = IDL.Record({
    boundary: NodeBoundary,
    allocationStrategies: IDL.Vec(IDL.Tuple(NodeDepth, AllocationStrategy)),
    rootNode: ShareableNode,
  });
  const ShareableBlockProperties = IDL.Record({
    title: IDL.Opt(ShareableBlockText),
    checked: IDL.Opt(IDL.Bool),
  });
  const AddBlockUpdateInput = IDL.Record({
    content: BlockContent,
    uuid: UUID,
    blockType: BlockType,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const PrimaryKey = IDL.Nat;
  const AddBlockUpdateOutputResult = IDL.Record({ id: PrimaryKey });
  const AddBlockUpdateOutputError = IDL.Null;
  const AddBlockUpdateOutput = IDL.Variant({
    ok: AddBlockUpdateOutputResult,
    err: AddBlockUpdateOutputError,
  });
  const ShareableBlock = IDL.Record({
    id: PrimaryKey,
    content: BlockContent,
    uuid: UUID,
    blockType: BlockType,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const Result_1 = IDL.Variant({
    ok: ShareableBlock,
    err: IDL.Variant({ blockNotFound: IDL.Null }),
  });
  const CreatePageUpdateInput = IDL.Record({
    content: BlockContent,
    uuid: UUID,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const CreatePageUpdateOutputResult = IDL.Record({
    id: PrimaryKey,
    content: BlockContent,
    uuid: UUID,
    blockType: BlockType,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const CreatePageUpdateOutputError = IDL.Variant({
    failedToCreate: IDL.Null,
    anonymousUser: IDL.Null,
    invalidBlockType: IDL.Null,
    insufficientCycles: IDL.Null,
    inputTooLong: IDL.Null,
  });
  const CreatePageUpdateOutput = IDL.Variant({
    ok: CreatePageUpdateOutputResult,
    err: CreatePageUpdateOutputError,
  });
  const ShareablePage = IDL.Record({
    id: PrimaryKey,
    content: BlockContent,
    uuid: UUID,
    blockType: BlockType,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const Result = IDL.Variant({
    ok: ShareablePage,
    err: IDL.Variant({ pageNotFound: IDL.Null }),
  });
  const SortDirection = IDL.Variant({ asc: IDL.Null, desc: IDL.Null });
  const SortOrder = IDL.Record({
    direction: SortDirection,
    fieldName: IDL.Text,
  });
  const Edge = IDL.Record({ node: ShareablePage });
  const PaginatedResults = IDL.Record({ edges: IDL.Vec(Edge) });
  const SaveEventUpdateInputPayload = IDL.Record({
    block: IDL.Record({
      content: BlockContent,
      uuid: UUID,
      blockType: BlockType,
      properties: ShareableBlockProperties,
      parent: IDL.Opt(UUID),
    }),
    index: IDL.Nat,
  });
  const Transaction = IDL.Variant({
    delete: IDL.Record({
      transactionType: IDL.Variant({ delete: IDL.Null }),
      position: NodeIdentifier,
    }),
    insert: IDL.Record({
      transactionType: IDL.Variant({ insert: IDL.Null }),
      value: NodeValue,
      position: NodeIdentifier,
    }),
  });
  const SaveEventUpdateInput = IDL.Variant({
    blockRemoved: IDL.Record({
      payload: IDL.Record({ blockExternalId: UUID, parent: UUID }),
      eventType: IDL.Variant({ blockRemoved: IDL.Null }),
    }),
    blockCreated: IDL.Record({
      payload: SaveEventUpdateInputPayload,
      eventType: IDL.Variant({ blockCreated: IDL.Null }),
    }),
    blockTypeChanged: IDL.Record({
      payload: IDL.Record({
        blockType: BlockType,
        blockExternalId: UUID,
      }),
      eventType: IDL.Variant({ blockTypeChanged: IDL.Null }),
    }),
    blockUpdated: IDL.Record({
      payload: IDL.Record({
        transactions: IDL.Vec(Transaction),
        blockExternalId: UUID,
      }),
      eventType: IDL.Variant({ blockUpdated: IDL.Null }),
    }),
  });
  const SaveEventUpdateOutputResult = IDL.Null;
  const SaveEventUpdateOutputError = IDL.Variant({
    anonymousUser: IDL.Null,
    insufficientCycles: IDL.Null,
  });
  const SaveEventUpdateOutput = IDL.Variant({
    ok: SaveEventUpdateOutputResult,
    err: SaveEventUpdateOutputError,
  });
  const UpdateBlockUpdateInput = IDL.Record({
    id: PrimaryKey,
    content: BlockContent,
    uuid: UUID,
    blockType: BlockType,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const UpdateBlockUpdateOutputResult = IDL.Record({
    id: PrimaryKey,
    content: BlockContent,
    uuid: UUID,
    blockType: BlockType,
    properties: ShareableBlockProperties,
    parent: IDL.Opt(UUID),
  });
  const UpdateBlockUpdateOutputError = IDL.Variant({
    primaryKeyAttrNotFound: IDL.Null,
  });
  const UpdateBlockUpdateOutput = IDL.Variant({
    ok: UpdateBlockUpdateOutputResult,
    err: UpdateBlockUpdateOutputError,
  });
  return IDL.Service({
    addBlock: IDL.Func([AddBlockUpdateInput], [AddBlockUpdateOutput], []),
    blockByUuid: IDL.Func([UUID], [Result_1], ['query']),
    createPage: IDL.Func([CreatePageUpdateInput], [CreatePageUpdateOutput], []),
    page: IDL.Func([PrimaryKey], [Result], ['query']),
    pageByUuid: IDL.Func([UUID], [Result], ['query']),
    pages: IDL.Func(
      [
        IDL.Record({
          order: IDL.Opt(SortOrder),
          cursor: IDL.Opt(PrimaryKey),
          limit: IDL.Opt(IDL.Nat),
        }),
      ],
      [PaginatedResults],
      ['query']
    ),
    saveEvent: IDL.Func([SaveEventUpdateInput], [SaveEventUpdateOutput], []),
    updateBlock: IDL.Func([UpdateBlockUpdateInput], [UpdateBlockUpdateOutput], []),
  });
};
export const init = ({ IDL }) => {
  return [];
};
