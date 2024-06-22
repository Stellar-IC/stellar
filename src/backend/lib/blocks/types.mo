import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import Tree "../../utils/data/lseq/Tree";
import LseqTypes "../../utils/data/lseq/types";

module Types {
    public type PrimaryKey = Text;
    public type BlockText = Tree.Tree;
    public type BlockId = UUID.UUID;
    public type ShareableBlockText = LseqTypes.ShareableTree;
    public type BlockContent = Tree.Tree;
    public type ShareableBlockContent = LseqTypes.ShareableTree;

    public type BlockProperties = {
        var title : ?BlockText;
        var checked : ?Bool;
    };

    public type ShareableBlockProperties = {
        title : ?ShareableBlockText;
        checked : ?Bool;
    };

    public type BlockType = {
        #heading1;
        #heading2;
        #heading3;
        #page;
        #paragraph;
        #todoList;
        #bulletedList;
        #numberedList;
        #code;
        #quote;
        #callout;
        #toggleHeading1;
        #toggleHeading2;
        #toggleHeading3;
    };

    public type Block = {
        uuid : BlockId;
        var blockType : BlockType;
        content : BlockContent;
        var parent : ?BlockId;
        properties : BlockProperties;
    };

    public type ShareableBlock = {
        uuid : BlockId;
        blockType : BlockType;
        content : ShareableBlockContent;
        parent : ?BlockId;
        properties : ShareableBlockProperties;
    };

    public type CoreBlockEventData = {
        uuid : BlockId;
        user : Principal;
        timestamp : Time.Time;
    };

    public type BlockCreatedEventData = {
        index : Nat;
        block : {
            uuid : BlockId;
            blockType : BlockType;
            parent : ?BlockId;
        };
    };

    public type BlockCreatedEvent = CoreBlockEventData and {
        data : BlockCreatedEventData;
    };

    public type BlockContentUpdatedEvent = {
        uuid : BlockId;
        data : {
            blockExternalId : BlockId;
            transaction : [LseqTypes.TreeEvent];
        };
        user : Principal;
    };

    public type BlockParentUpdatedEventData = {
        blockExternalId : BlockId;
        parentBlockExternalId : BlockId;
    };

    public type BlockParentUpdatedEvent = CoreBlockEventData and {
        data : BlockParentUpdatedEventData;
    };

    public type BlockBlockTypeUpdatedEventData = {
        blockExternalId : BlockId;
        blockType : BlockType;
    };

    public type BlockPropertyCheckedUpdatedEventData = {
        blockExternalId : BlockId;
        checked : Bool;
    };

    public type BlockPropertyTitleUpdatedEventData = {
        blockExternalId : BlockId;
        transaction : [LseqTypes.TreeEvent];
    };

    public type BlockPropertyUpdatedEvent = CoreBlockEventData and {
        data : {
            #title : BlockPropertyTitleUpdatedEventData;
            #checked : BlockPropertyCheckedUpdatedEventData;
        };
    };

    public type BlockPropertyCheckedUpdatedEvent = {
        uuid : BlockId;
        data : {
            blockExternalId : BlockId;
            checked : Bool;
        };
        user : Principal;
    };

    public type BlockPropertyTitleUpdatedEvent = {
        uuid : BlockId;
        data : {
            blockExternalId : BlockId;
            transaction : [LseqTypes.TreeEvent];
        };
        user : Principal;
    };

    public type BlockTypeUpdatedEvent = {
        uuid : BlockId;
        data : {
            blockExternalId : BlockId;
            blockType : BlockType;
        };
        user : Principal;
    };

    public type BlockContentUpdatedEventData = {
        blockExternalId : BlockId;
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
