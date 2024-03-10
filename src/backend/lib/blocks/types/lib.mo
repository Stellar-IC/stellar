import Types "./v2";
import Types_v1 "./v1";

module {
    public type PrimaryKey = Types.PrimaryKey;
    public type BlockText = Types.BlockText;
    public type ShareableBlockText = Types.ShareableBlockText;
    public type BlockContent = Types.BlockContent;
    public type ShareableBlockContent = Types.ShareableBlockContent;

    public type BlockProperties = Types.BlockProperties;
    public type ShareableBlockProperties = Types.ShareableBlockProperties;
    public type BlockType = Types.BlockType;
    public type UnsavedBlock = Types_v1.UnsavedBlock; // Deprecated
    public type Block = Types.Block;
    public type ShareableUnsavedBlock = Types_v1.ShareableUnsavedBlock; // Deprecated
    public type ShareableBlock = Types.ShareableBlock;

    public type CoreBlockEventData = Types.CoreBlockEventData;
    public type BlockCreatedEvent = Types.BlockCreatedEvent;
    public type BlockCreatedEventData = Types.BlockCreatedEventData;
    public type BlockUpdatedEvent = Types.BlockUpdatedEvent;
    public type BlockUpdatedEventData = Types.BlockUpdatedEventData;
    public type BlockEvent = Types.BlockEvent;
    public type BlockEventTransaction = Types.BlockEventTransaction;
    public type BlockParentUpdatedEvent = Types.BlockParentUpdatedEvent;
    public type BlockParentUpdatedEventData = Types.BlockParentUpdatedEventData;
    public type BlockPropertyUpdatedEvent = Types.BlockPropertyUpdatedEvent;
    public type BlockPropertyCheckedUpdatedEventData = Types.BlockPropertyCheckedUpdatedEventData;
    public type BlockPropertyTitleUpdatedEventData = Types.BlockPropertyTitleUpdatedEventData;
    public type BlockBlockTypeUpdatedEventData = Types.BlockBlockTypeUpdatedEventData;
    public type BlockContentUpdatedEventData = Types.BlockContentUpdatedEventData;
};
