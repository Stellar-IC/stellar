import UUID "mo:uuid/UUID";

import Tree "../../utils/data/lseq/Tree";
import LseqTypes "../../utils/data/lseq/types";

module {
    public type PrimaryKey = Nat;
    public type BlockText = Tree.Tree;
    public type ShareableBlockText = LseqTypes.ShareableTree;
    // public type BlockContent = Tree.Tree;
    public type BlockContent = [UUID.UUID];
    public type BlockProperties = {
        title : ?BlockText;
        checked : ?Bool;
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
    };
    public type UnsavedBlock = {
        uuid : UUID.UUID;
        var blockType : BlockType;
        var content : BlockContent;
        parent : ?UUID.UUID;
        properties : BlockProperties;
    };
    public type Block = UnsavedBlock and {
        id : PrimaryKey;
    };
    public type ShareableUnsavedBlock = {
        uuid : UUID.UUID;
        blockType : BlockType;
        content : BlockContent;
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };
    public type ShareableBlock = ShareableUnsavedBlock and {
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
            blockExternalId : UUID.UUID;
            parent : UUID.UUID;
        };
        user : Principal;
    };

    public type BlockUpdatedEvent = {
        #updatePropertyTitle : {
            uuid : UUID.UUID;
            data : {
                blockExternalId : UUID.UUID;
                event : LseqTypes.TreeEvent;
            };
            user : Principal;
        };
        #updateBlockType : {
            uuid : UUID.UUID;
            data : {
                blockExternalId : UUID.UUID;
                blockType : BlockType;
            };
            user : Principal;
        };
    };

    public type BlockEvent = {
        #empty : ();
        #blockCreated : BlockCreatedEvent;
        #blockUpdated : BlockUpdatedEvent;
        #blockRemoved : BlockRemovedEvent;
    };

    public type BlockEventTransaction = [BlockEvent];

};
