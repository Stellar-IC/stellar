import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../lib/blocks/types";

module {
    type Block = BlocksTypes.Block_v2;
    type UnsavedBlock = BlocksTypes.UnsavedBlock_v2;
    type ShareableBlock = BlocksTypes.ShareableBlock_v2;
    type ShareableBlockContent = BlocksTypes.ShareableBlockContent;
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
                content : ShareableBlockContent;
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
            public type BlockByUuidResult = Result.Result<ShareableBlock, { #blockNotFound }>;
        };
    };

    public module Updates {
        public module AddBlockUpdate {
            public type AddBlockUpdateInput = {
                uuid : UUID.UUID;
                blockType : BlocksTypes.BlockType;
                content : BlocksTypes.ShareableBlockContent;
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
                content : BlocksTypes.ShareableBlockContent;
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
            public type CreatePageUpdateOutputResult = ShareableBlock;
            public type CreatePageUpdateOutput = Result.Result<CreatePageUpdateOutputResult, CreatePageUpdateOutputError>;
        };

        public module UpdateBlockUpdate {
            public type UpdateBlockUpdateInput = ShareableBlock;
            public type UpdateBlockUpdateOutputError = {
                #primaryKeyAttrNotFound;
            };
            public type UpdateBlockUpdateOutputResult = ShareableBlock;
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

        public module SaveEventTransactionUpdate {
            public type SaveEventTransactionUpdateInput = {
                transaction : BlocksTypes.BlockEventTransaction;
            };

            public type SaveEventTransactionUpdateOutputError = {
                #anonymousUser;
                #insufficientCycles;
            };
            public type SaveEventTransactionUpdateOutputResult = ();
            public type SaveEventTransactionUpdateOutput = Result.Result<SaveEventTransactionUpdateOutputResult, SaveEventTransactionUpdateOutputError>;
        };
    };
};
