import Types "./v0";

module {
    public type PrimaryKey = Types.PrimaryKey;
    public type BlockText = Types.BlockText;
    public type ShareableBlockText = Types.ShareableBlockText;
    public type BlockContent = Types.BlockContent;
    public type ShareableBlockContent = Types.ShareableBlockContent;

    public type BlockProperties = Types.BlockProperties;
    public type ShareableBlockProperties = Types.ShareableBlockProperties;
    public type BlockType = Types.BlockType;
    public type UnsavedBlock = Types.UnsavedBlock;
    public type Block = Types.Block;
    public type ShareableUnsavedBlock = Types.ShareableUnsavedBlock;
    public type ShareableBlock = Types.ShareableBlock;

    public type BlockCreatedEvent = Types.BlockCreatedEvent;
    public type BlockUpdatedEvent = Types.BlockUpdatedEvent;
    public type BlockEvent = Types.BlockEvent;
    public type BlockEventTransaction = Types.BlockEventTransaction;
    public type BlockParentUpdatedEvent = Types.BlockParentUpdatedEvent;
};
