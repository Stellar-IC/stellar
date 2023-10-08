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
        blockType : BlockType;
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
        eventType : { #blockCreated };
        data : {
            index : Nat;
            block : {
                uuid : UUID.UUID;
                blockType : BlockType;
                content : BlockContent;
                parent : ?UUID.UUID;
                properties : BlockProperties;
            };
        };
        user : Principal;
    };

    public type BlockRemovedEvent = {
        uuid : UUID.UUID;
        eventType : { #blockRemoved };
        data : {
            blockExternalId : UUID.UUID;
            parent : UUID.UUID;
        };
        user : Principal;
    };

    public type BlockUpdatedEventTransaction = {
        #insert : {
            transactionType : { #insert };
            position : LseqTypes.NodeIdentifier;
            value : LseqTypes.NodeValue;
        };
        #delete : {
            transactionType : { #delete };
            position : LseqTypes.NodeIdentifier;
        };
    };

    public type BlockUpdatedEvent = {
        uuid : UUID.UUID;
        eventType : { #blockUpdated };
        data : {
            blockExternalId : UUID.UUID;
            transactions : [BlockUpdatedEventTransaction];
        };
        user : Principal;
    };

    public type BlockEvent = {
        #empty : ();
        #blockCreated : BlockCreatedEvent;
        #blockUpdated : BlockUpdatedEvent;
        #blockRemoved : BlockRemovedEvent;
    };
};
