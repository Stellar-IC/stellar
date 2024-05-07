import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import Tree "../../utils/data/lseq/Tree";
import LseqTypes "../../utils/data/lseq/types";

module Types {
    public type PrimaryKey = Text;
    public type BlockText = Tree.Tree;
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

    public type BlockContentUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            blockExternalId : UUID.UUID;
            transaction : [LseqTypes.TreeEvent];
        };
        user : Principal;
    };

    public type BlockParentUpdatedEventData = {
        blockExternalId : UUID.UUID;
        parentBlockExternalId : UUID.UUID;
    };

    public type BlockParentUpdatedEvent = CoreBlockEventData and {
        data : BlockParentUpdatedEventData;
    };

    public type BlockBlockTypeUpdatedEventData = {
        blockExternalId : UUID.UUID;
        blockType : BlockType;
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
            #title : BlockPropertyTitleUpdatedEventData;
            #checked : BlockPropertyCheckedUpdatedEventData;
        };
    };

    public type BlockPropertyCheckedUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            blockExternalId : UUID.UUID;
            checked : Bool;
        };
        user : Principal;
    };

    public type BlockPropertyTitleUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            blockExternalId : UUID.UUID;
            transaction : [LseqTypes.TreeEvent];
        };
        user : Principal;
    };

    public type BlockTypeUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            blockExternalId : UUID.UUID;
            blockType : BlockType;
        };
        user : Principal;
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
