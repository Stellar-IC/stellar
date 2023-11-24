import UUID "mo:uuid/UUID";

import Tree "../../utils/data/lseq/Tree";
import LseqTypes "../../utils/data/lseq/types";

module {
    public type PrimaryKey = Nat;
    public type BlockText = Tree.Tree;
    public type ShareableBlockText = LseqTypes.ShareableTree;
    public type BlockContent = [UUID.UUID];
    public type BlockContent_v2 = Tree.Tree;
    public type ShareableBlockContent = LseqTypes.ShareableTree;

    public type BlockProperties = {
        title : ?BlockText;
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
        #toggleList;
        #code;
        #quote;
        #callout;
        #toggleHeading1;
        #toggleHeading2;
        #toggleHeading3;
    };
    public type UnsavedBlock = {
        uuid : UUID.UUID;
        var blockType : BlockType;
        content : BlockContent;
        parent : ?UUID.UUID;
        properties : BlockProperties;
    };
    public type UnsavedBlock_v2 = {
        uuid : UUID.UUID;
        var blockType : BlockType;
        content : BlockContent_v2;
        var parent : ?UUID.UUID;
        properties : BlockProperties;
    };
    public type Block = UnsavedBlock and {
        id : PrimaryKey;
    };
    public type Block_v2 = UnsavedBlock_v2 and {
        id : PrimaryKey;
    };
    public type ShareableUnsavedBlock = {
        uuid : UUID.UUID;
        blockType : BlockType;
        content : BlockContent;
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };
    public type ShareableUnsavedBlock_v2 = {
        uuid : UUID.UUID;
        blockType : BlockType;
        content : ShareableBlockContent;
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };
    public type ShareableBlock = ShareableUnsavedBlock and {
        id : PrimaryKey;
    };
    public type ShareableBlock_v2 = ShareableUnsavedBlock_v2 and {
        id : PrimaryKey;
    };

    public type BlockCreatedEvent = {
        uuid : UUID.UUID;
        data : {
            index : Nat;
            block : {
                uuid : UUID.UUID;
                blockType : BlockType;
                parent : ?UUID.UUID;
            };
        };
        user : Principal;
    };

    public type BlockRemovedEvent = {
        uuid : UUID.UUID;
        data : {
            index : Nat;
            block : {
                uuid : UUID.UUID;
                parent : UUID.UUID;
            };
        };
        user : Principal;
    };

    public type BlockContentUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            transaction : [LseqTypes.TreeEvent];
        };
        user : Principal;
    };
    public type BlockParentUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            blockExternalId : UUID.UUID;
            parentBlockExternalId : UUID.UUID;
        };
        user : Principal;
    };

    public type BlockProperyCheckedUpdatedEvent = {
        uuid : UUID.UUID;
        data : {
            blockExternalId : UUID.UUID;
            checked : Bool;
        };
        user : Principal;
    };

    public type BlockProperyTitleUpdatedEvent = {
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

    public type BlockUpdatedEvent = {
        #updatePropertyChecked : BlockProperyCheckedUpdatedEvent;
        #updatePropertyTitle : BlockProperyTitleUpdatedEvent;
        #updateBlockType : BlockTypeUpdatedEvent;
        #updateContent : BlockContentUpdatedEvent;
        #updateParent : BlockParentUpdatedEvent;
    };

    public type BlockEvent = {
        #empty : ();
        #blockCreated : BlockCreatedEvent;
        #blockUpdated : BlockUpdatedEvent;
        #blockRemoved : BlockRemovedEvent;
    };

    public type BlockEventTransaction = [BlockEvent];

};
