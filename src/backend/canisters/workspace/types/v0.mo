import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../../lib/blocks/types";
import CoreTypes "../../../types";

module {
    public type Block = BlocksTypes.Block;
    public type ShareableBlock = BlocksTypes.ShareableBlock;
    public type ShareableBlockContent = BlocksTypes.ShareableBlockContent;
    public type ShareableBlockProperties = BlocksTypes.ShareableBlockProperties;

    public type PrimaryKey = Nat;
    public type Username = Text;

    public module Services {
        public module CreateBlockService {
            public type CreateBlockServiceInput = Block;
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
                initialBlockUuid : UUID.UUID;
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
        public module BlocksByPageUuid {
            public type BlocksByPageUuidResult = List.List<ShareableBlock>;
        };
        public module PageByUuid {
            public type PageByUuidResult = Result.Result<ShareableBlock, { #pageNotFound }>;
        };
        public module Pages {
            public type PagesOptionsArg = {
                cursor : ?PrimaryKey;
                limit : ?Nat;
                order : ?CoreTypes.SortOrder;
            };
            public type PagesResult = {
                pages : CoreTypes.PaginatedResults<Text>;
                recordMap : { blocks : [(Text, ShareableBlock)] };
            };
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
                initialBlockUuid : UUID.UUID;
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

        public module DeletePageUpdate {
            public type DeletePageUpdateInput = {
                uuid : UUID.UUID;
            };
            public type DeletePageUpdateOutputError = ();
            public type DeletePageUpdateOutputResult = ();
            public type DeletePageUpdateOutput = Result.Result<DeletePageUpdateOutputResult, DeletePageUpdateOutputError>;
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
