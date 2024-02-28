import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import LseqTypes "../../../utils/data/lseq/types";
import Types_v0 "./v0";

module Types {
    public type PrimaryKey = Types_v0.PrimaryKey;
    public type BlockText = Types_v0.BlockText;
    public type ShareableBlockText = Types_v0.ShareableBlockText;
    public type BlockContent = Types_v0.BlockContent;
    public type ShareableBlockContent = Types_v0.ShareableBlockContent;

    public type BlockProperties = Types_v0.BlockProperties;
    public type ShareableBlockProperties = Types_v0.ShareableBlockProperties;
    public type BlockType = Types_v0.BlockType;
    public type UnsavedBlock = Types_v0.UnsavedBlock;
    public type Block = Types_v0.Block;
    public type ShareableUnsavedBlock = Types_v0.ShareableUnsavedBlock;
    public type ShareableBlock = Types_v0.ShareableBlock;

    public type CoreBlockEventData = {
        uuid : UUID.UUID;
        user : Principal;
        timestamp : Time.Time;
    };

    public type BlockCreatedEventData = {
        index : Nat;
        block : {
            uuid : UUID.UUID;
            blockType : BlockType;
            parent : ?UUID.UUID;
        };
    };

    public type BlockCreatedEvent = CoreBlockEventData and {
        data : BlockCreatedEventData;
    };

    public type BlockParentUpdatedEventData = {
        blockExternalId : UUID.UUID;
        parentBlockExternalId : UUID.UUID;
    };

    public type BlockParentUpdatedEvent = CoreBlockEventData and {
        data : BlockParentUpdatedEventData;
    };

    public type BlockPropertyCheckedUpdatedEventData = {
        blockExternalId : UUID.UUID;
        checked : Bool;
    };

    public type BlockPropertyTitleUpdatedEventData = {
        blockExternalId : UUID.UUID;
        transaction : [LseqTypes.TreeEvent];
    };

    public type BlockPropertyUpdatedEvent = CoreBlockEventData and {
        data : {
            #checked : BlockPropertyCheckedUpdatedEventData;
            #title : BlockPropertyTitleUpdatedEventData;
        };
    };

    public type BlockBlockTypeUpdatedEventData = {
        blockExternalId : UUID.UUID;
        blockType : BlockType;
    };

    public type BlockContentUpdatedEventData = {
        blockExternalId : UUID.UUID;
        transaction : [LseqTypes.TreeEvent];
    };

    public type BlockUpdatedEventData = {
        #updatePropertyChecked : BlockPropertyCheckedUpdatedEventData;
        #updatePropertyTitle : BlockPropertyTitleUpdatedEventData;
        #updateBlockType : BlockBlockTypeUpdatedEventData;
        #updateContent : BlockContentUpdatedEventData;
        #updateParent : BlockParentUpdatedEventData;
    };

    public type BlockUpdatedEvent = CoreBlockEventData and {
        data : BlockUpdatedEventData;
    };

    public type BlockEvent = CoreBlockEventData and {
        data : {
            #blockCreated : BlockCreatedEventData;
            #blockUpdated : BlockUpdatedEventData;
        };
    };

    public type BlockEventTransaction = [BlockEvent];
};
