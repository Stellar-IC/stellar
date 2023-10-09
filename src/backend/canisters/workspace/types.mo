import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../lib/blocks/types";

module {
    type Block = BlocksTypes.Block;
    type UnsavedBlock = BlocksTypes.UnsavedBlock;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type ShareableBlockProperties = BlocksTypes.ShareableBlockProperties;

    public type PrimaryKey = Nat;
    public type Username = Text;

    public module Services {
        public module CreateBlockService {
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
        };

        public module UpdateBlockService {
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
        };

        public module DeleteBlockService {
            public type DeleteBlockServiceInput = { id : PrimaryKey };
            public type DeleteBlockServiceOutputError = {
                #anonymousUser;
            };
            public type DeleteBlockServiceOutputResult = ();
            public type DeleteBlockServiceOutput = Result.Result<DeleteBlockServiceOutputResult, DeleteBlockServiceOutputError>;
        };

        public module CreatePageService {
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
            public type CreatePageServiceOutputResult = ShareableBlock;
            public type CreatePageServiceOutput = Result.Result<CreatePageServiceOutputResult, CreatePageServiceOutputError>;
        };
    };

    public module Queries {
        public module BlockByUuid {
            public type BlockByUuidResult = Result.Result<BlocksTypes.ShareableBlock, { #blockNotFound }>;
        };
    };

    public module Updates {
        public module AddBlockUpdate {
            public type AddBlockUpdateInput = {
                uuid : UUID.UUID;
                blockType : BlocksTypes.BlockType;
                content : BlocksTypes.BlockContent;
                parent : ?UUID.UUID;
                properties : BlocksTypes.ShareableBlockProperties;
            };
            public type AddBlockUpdateOutputError = ();
            public type AddBlockUpdateOutputResult = { id : PrimaryKey };
            public type AddBlockUpdateOutput = Result.Result<AddBlockUpdateOutputResult, AddBlockUpdateOutputError>;
        };

        public module CreatePageUpdate {
            public type CreatePageUpdateInput = {
                uuid : UUID.UUID;
                content : BlocksTypes.BlockContent;
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
            public type CreatePageUpdateOutputResult = BlocksTypes.ShareableBlock;
            public type CreatePageUpdateOutput = Result.Result<CreatePageUpdateOutputResult, CreatePageUpdateOutputError>;
        };

        public module UpdateBlockUpdate {
            public type UpdateBlockUpdateInput = BlocksTypes.ShareableBlock;
            public type UpdateBlockUpdateOutputError = {
                #primaryKeyAttrNotFound;
            };
            public type UpdateBlockUpdateOutputResult = BlocksTypes.ShareableBlock;
            public type UpdateBlockUpdateOutput = Result.Result<UpdateBlockUpdateOutputResult, UpdateBlockUpdateOutputError>;
        };

        public module RemoveBlockUpdate {
            public type RemoveBlockUpdateInput = {
                uuid : UUID.UUID;
            };
            public type RemoveBlockUpdateOutputError = ();
            public type RemoveBlockUpdateOutputResult = ();
            public type RemoveBlockUpdateOutput = Result.Result<RemoveBlockUpdateOutputResult, RemoveBlockUpdateOutputError>;
        };

        public module SaveEventUpdate {
            public type SaveEventUpdateInputBlockCreatedPaylaod = {
                index : Nat;
                block : {
                    uuid : UUID.UUID;
                    blockType : BlocksTypes.BlockType;
                    content : BlocksTypes.BlockContent;
                    parent : ?UUID.UUID;
                    properties : BlocksTypes.ShareableBlockProperties;
                };
            };

            public type SaveEventUpdateInput = {
                #blockCreated : {
                    eventType : { #blockCreated };
                    payload : SaveEventUpdateInputBlockCreatedPaylaod;
                };
                #blockUpdated : {
                    eventType : { #blockUpdated };
                    payload : {
                        blockExternalId : UUID.UUID;
                        transactions : [BlocksTypes.BlockUpdatedEventTransaction];
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
                        blockType : BlocksTypes.BlockType;
                    };
                };
            };
            public type SaveEventUpdateOutputError = {
                #anonymousUser;
                #insufficientCycles;
            };
            public type SaveEventUpdateOutputResult = ();
            public type SaveEventUpdateOutput = Result.Result<SaveEventUpdateOutputResult, SaveEventUpdateOutputError>;
        };
    };
};
