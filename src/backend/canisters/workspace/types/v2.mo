import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import ActivitiesTypes "../../../lib/activities/types";
import BlocksTypes "../../../lib/blocks/types";
import EventsTypes "../../../lib/events/types";
import CoreTypes "../../../types";

module {
    public type ExternalId = Text;
    public type PrimaryKey = Nat;
    public type Block = BlocksTypes.Block;
    public type BlockEvent = BlocksTypes.BlockEvent;
    public type UnsavedBlock = BlocksTypes.UnsavedBlock;
    public type ShareableBlock = BlocksTypes.ShareableBlock;
    public type ShareableBlockContent = BlocksTypes.ShareableBlockContent;
    public type ShareableBlockProperties = BlocksTypes.ShareableBlockProperties;
    public type WorkspaceOwner = Principal;

    public type WorkspaceInitArgs = {
        capacity : Nat;
        owner : WorkspaceOwner;
    };

    public type WorkspaceInitData = {
        uuid : UUID.UUID;
        name : Text;
        description : Text;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    };

    public type WorkspaceUserRole = {
        #admin;
        #moderator;
        #member;
        #guest;
    };

    public type WorkspaceUser = {
        canisterId : Principal;
        username : Text;
        role : WorkspaceUserRole;
    };

    public module Services {
        public module CreateActivityService {
            public type CreateActivityServiceInput = {
                id : Nat;
                edits : [ActivitiesTypes.EditItem];
                blockExternalId : UUID.UUID;
            };
            public type CreateActivityServiceOutputError = {
                #anonymousUser;
                #failedToCreate;
                #inputTooLong;
                #invalidActivityType;
                #insufficientCycles;
            };
            public type CreateActivityServiceOutput = ActivitiesTypes.Activity;
        };

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

        public module ExtendActivityService {
            public type ExtendActivityServiceInput = {
                activityId : Nat;
                edits : [ActivitiesTypes.EditItem];
            };
            public type ExtendActivityServiceOutput = ActivitiesTypes.Activity;
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
                initialBlockUuid : ?UUID.UUID;
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
        public module ActivityLog {
            public type ActivityLogOutput = CoreTypes.PaginatedResults<ActivitiesTypes.HydratedActivity>;
        };

        public module BlockByUuid {
            public type BlockByUuidOptions = {
                contentPagination : {
                    cursor : Nat;
                    limit : Nat;
                };
            };
            public type BlockByUuidResult = Result.Result<{ block : ExternalId; recordMap : { blocks : [(ExternalId, ShareableBlock)] } }, { #notFound }>;
        };

        public module BlocksByPageUuid {
            public type BlocksByPageUuidResult = {
                blocks : CoreTypes.PaginatedResults<ExternalId>;
                recordMap : { blocks : [(ExternalId, ShareableBlock)] };
            };
        };

        public module GetInitArgs {
            public type GetInitArgsOutput = Result.Result<WorkspaceInitArgs, { #unauthorized }>;
        };

        public module GetInitData {
            public type GetInitDataOutput = Result.Result<WorkspaceInitData, { #unauthorized }>;
        };

        public module PageByUuid {
            public type PageByUuidResult = Result.Result<{ page : ExternalId; recordMap : { blocks : [(ExternalId, ShareableBlock)] } }, { #notFound }>;
        };

        public module Pages {
            public type PagesOptionsArg = {
                cursor : ?PrimaryKey;
                limit : ?Nat;
                order : ?CoreTypes.SortOrder;
            };
            public type PagesResult = {
                pages : CoreTypes.PaginatedResults<ExternalId>;
                recordMap : { blocks : [(ExternalId, ShareableBlock)] };
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
            public type AddBlockUpdateOutputError = { #unauthorized };
            public type AddBlockUpdateOutputResult = ();
            public type AddBlockUpdateOutput = Result.Result<AddBlockUpdateOutputResult, AddBlockUpdateOutputError>;
        };

        public module AddUsersUpdate {
            public type AddUsersUpdateInput = [(Principal, WorkspaceUser)];
            public type AddUsersUpdateResult = Result.Result<(), { #unauthorized }>;
        };

        public module CreatePageUpdate {
            public type CreatePageUpdateInput = {
                uuid : UUID.UUID;
                content : BlocksTypes.ShareableBlockContent;
                parent : ?UUID.UUID;
                properties : ShareableBlockProperties;
                initialBlockUuid : ?UUID.UUID;
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

        public module DeletePageUpdate {
            public type DeletePageUpdateInput = { uuid : UUID.UUID };
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

        public module UpdateBlockUpdate {
            public type UpdateBlockUpdateInput = ShareableBlock;
            public type UpdateBlockUpdateOutputError = {
                #primaryKeyAttrNotFound;
            };
            public type UpdateBlockUpdateOutputResult = ShareableBlock;
            public type UpdateBlockUpdateOutput = Result.Result<UpdateBlockUpdateOutputResult, UpdateBlockUpdateOutputError>;
        };
    };
};
