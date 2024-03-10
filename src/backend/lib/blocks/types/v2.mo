import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import LseqTypes "../../../utils/data/lseq/types";
import Types_v1 "./v1";

module Types {
    public type PrimaryKey = Text;
    public type BlockText = Types_v1.BlockText;
    public type ShareableBlockText = Types_v1.ShareableBlockText;
    public type BlockContent = Types_v1.BlockContent;
    public type ShareableBlockContent = Types_v1.ShareableBlockContent;

    public type BlockProperties = Types_v1.BlockProperties;
    public type ShareableBlockProperties = Types_v1.ShareableBlockProperties;
    public type BlockType = Types_v1.BlockType;

    public type Block = {
        uuid : UUID.UUID;
        var blockType : BlockType;
        content : BlockContent;
        var parent : ?UUID.UUID;
        properties : BlockProperties;
    };

    public type ShareableBlock = {
        uuid : UUID.UUID;
        blockType : BlockType;
        content : ShareableBlockContent;
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };

    public type CoreBlockEventData = Types_v1.CoreBlockEventData;

    public type BlockCreatedEventData = Types_v1.BlockCreatedEventData;

    public type BlockCreatedEvent = Types_v1.BlockCreatedEvent;

    public type BlockParentUpdatedEventData = Types_v1.BlockParentUpdatedEventData;

    public type BlockParentUpdatedEvent = Types_v1.BlockParentUpdatedEvent;

    public type BlockPropertyCheckedUpdatedEventData = Types_v1.BlockPropertyCheckedUpdatedEventData;

    public type BlockPropertyTitleUpdatedEventData = Types_v1.BlockPropertyTitleUpdatedEventData;

    public type BlockPropertyUpdatedEvent = Types_v1.BlockPropertyUpdatedEvent;

    public type BlockBlockTypeUpdatedEventData = Types_v1.BlockBlockTypeUpdatedEventData;

    public type BlockContentUpdatedEventData = Types_v1.BlockContentUpdatedEventData;

    public type BlockUpdatedEventData = Types_v1.BlockUpdatedEventData;

    public type BlockUpdatedEvent = Types_v1.BlockUpdatedEvent;

    public type BlockEvent = Types_v1.BlockEvent;

    public type BlockEventTransaction = Types_v1.BlockEventTransaction;
};
