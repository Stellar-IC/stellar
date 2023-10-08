import Array "mo:base/Array";
import Char "mo:base/Char";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import BlocksTypes "../../lib/blocks/types";
import Tree "../../utils/data/lseq/Tree";
import TreeTypes "../../utils/data/lseq/types";

module Types {
    public type Block = BlocksTypes.Block;
    public type BlockContent = BlocksTypes.BlockContent;
    public type BlockProperties = BlocksTypes.BlockProperties;
    public type BlockType = BlocksTypes.BlockType;
    public type ShareableBlock = BlocksTypes.ShareableBlock;
    public type ShareableBlockProperties = BlocksTypes.ShareableBlockProperties;
    public type ShareablePage = BlocksTypes.ShareableBlock;
    public type UnsavedBlock = BlocksTypes.UnsavedBlock;
    public type UnsavedPage = BlocksTypes.UnsavedBlock;

    public type PrimaryKey = Nat;

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

    public type BlockUpdatedEvent = {
        uuid : UUID.UUID;
        eventType : { #blockUpdated };
        data : {
            blockExternalId : UUID.UUID;
            transactions : [Transaction];
        };
        user : Principal;
    };

    public type BlockEvent = {
        #empty : ();
        #blockCreated : BlockCreatedEvent;
        #blockUpdated : BlockUpdatedEvent;
        #blockRemoved : BlockRemovedEvent;
    };

    /**
     * UPDATES
     **/
    public type AddBlockUpdateInput = {

        uuid : UUID.UUID;
        blockType : BlockType;
        content : BlockContent;
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };
    public type AddBlockUpdateOutputError = ();
    public type AddBlockUpdateOutputResult = { id : PrimaryKey };
    public type AddBlockUpdateOutput = Result.Result<AddBlockUpdateOutputResult, AddBlockUpdateOutputError>;

    public type CreatePageUpdateInput = {
        uuid : UUID.UUID;
        content : BlockContent;
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };
    public type CreatePageUpdateOutputError = {
        #anonymousUser;
        #failedToCreate;
        #inputTooLong;
        #invalidBlockType;
        #insufficientCycles;
    };
    public type CreatePageUpdateOutputResult = ShareablePage;
    public type CreatePageUpdateOutput = Result.Result<CreatePageUpdateOutputResult, CreatePageUpdateOutputError>;

    public type UpdateBlockUpdateInput = ShareableBlock;
    public type UpdateBlockUpdateOutputError = {
        #primaryKeyAttrNotFound;
    };
    public type UpdateBlockUpdateOutputResult = ShareableBlock;
    public type UpdateBlockUpdateOutput = Result.Result<UpdateBlockUpdateOutputResult, UpdateBlockUpdateOutputError>;

    public type SaveEventUpdateInputPayload = {
        index : Nat;
        block : {
            uuid : UUID.UUID;
            blockType : BlockType;
            content : BlockContent;
            parent : ?UUID.UUID;
            properties : ShareableBlockProperties;
        };
    };

    public type Transaction = {
        #insert : {
            transactionType : { #insert };
            position : TreeTypes.NodeIdentifier;
            value : TreeTypes.NodeValue;
        };
        #delete : {
            transactionType : { #delete };
            position : TreeTypes.NodeIdentifier;
        };
    };

    public type SaveEventUpdateInput = {
        #blockCreated : {
            eventType : { #blockCreated };
            payload : SaveEventUpdateInputPayload;
        };
        #blockUpdated : {
            eventType : { #blockUpdated };
            payload : {
                blockExternalId : UUID.UUID;
                transactions : [Transaction];
            };
        };
        #blockRemoved : {
            eventType : { #blockRemoved };
            payload : {
                blockExternalId : UUID.UUID;
                parent : UUID.UUID;
            };
        };
        #blockTypeChanged : {
            eventType : { #blockTypeChanged };
            payload : {
                blockExternalId : UUID.UUID;
                blockType : BlockType;
            };
        };
    };
    public type SaveEventUpdateOutputError = {
        #anonymousUser;
        #insufficientCycles;
    };
    public type SaveEventUpdateOutputResult = ();
    public type SaveEventUpdateOutput = Result.Result<SaveEventUpdateOutputResult, SaveEventUpdateOutputError>;

    /**
     * SERVICES
     **/

    public type CreateBlockServiceInput = UnsavedBlock;
    public type CreateBlockServiceOutputError = {
        #anonymousUser;
        #failedToCreate;
        #inputTooLong;
        #invalidBlockType;
        #insufficientCycles;
    };
    public type CreateBlockServiceOutputResult = Block;
    public type CreateBlockServiceOutput = Result.Result<CreateBlockServiceOutputResult, CreateBlockServiceOutputError>;

    public type UpdateBlockServiceInput = Block;
    public type UpdateBlockServiceOutputError = {
        #anonymousUser;
        #failedToUpdate;
        #inputTooLong;
        #invalidBlockType;
        #insufficientCycles;
    };
    public type UpdateBlockServiceOutputResult = Block;
    public type UpdateBlockServiceOutput = Result.Result<UpdateBlockServiceOutputResult, UpdateBlockServiceOutputError>;

    public type DeleteBlockServiceInput = { id : PrimaryKey };
    public type DeleteBlockServiceOutputError = {
        #anonymousUser;
    };
    public type DeleteBlockServiceOutputResult = ();
    public type DeleteBlockServiceOutput = Result.Result<DeleteBlockServiceOutputResult, DeleteBlockServiceOutputError>;

    public type CreatePageServiceInput = {
        uuid : UUID.UUID;
        content : [UUID.UUID];
        parent : ?UUID.UUID;
        properties : ShareableBlockProperties;
    };
    public type CreatePageServiceOutputError = {
        #anonymousUser;
        #failedToCreate;
        #inputTooLong;
        #invalidBlockType;
        #insufficientCycles;
    };
    public type CreatePageServiceOutputResult = ShareablePage;
    public type CreatePageServiceOutput = Result.Result<CreatePageServiceOutputResult, CreatePageServiceOutputError>;
};
