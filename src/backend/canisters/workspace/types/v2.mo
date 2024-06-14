import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import UUID "mo:uuid/UUID";
import Map "mo:map/Map";

import ActivitiesTypes "../../../lib/activities/types";
import BlocksTypes "../../../lib/blocks/types";
import EventsTypes "../../../lib/events/types";
import CoreTypes "../../../types";

module {
    public type ExternalId = Text;
    public type PrimaryKey = Nat;
    public type Block = BlocksTypes.Block;
    public type BlockId = BlocksTypes.BlockId;
    public type BlockEvent = BlocksTypes.BlockEvent;
    public type ShareableBlock = BlocksTypes.ShareableBlock;
    public type ShareableBlockContent = BlocksTypes.ShareableBlockContent;
    public type ShareableBlockProperties = BlocksTypes.ShareableBlockProperties;
    public type WorkspaceOwner = Principal;

    public type PubSubEvent = {
        #workspaceNameUpdated : {
            workspaceId : Principal;
            name : Text;
        };
    };
    public type PubSubEventHandler = shared (
        eventName : Text,
        event : PubSubEvent,
    ) -> async ();

    public type WorkspaceUserRole = {
        #admin;
        #moderator;
        #member;
        #guest;
    };

    public type BlockUserRole = {
        #owner;
        #editor;
        #viewer;
    };

    public type WorkspaceVisibility = {
        #Public;
        #Private;
    };

    public type WorkspaceUser = {
        identity : Principal;
        canisterId : Principal;
        username : Text;
        role : WorkspaceUserRole;
    };

    public type WorkspaceUserV2 = {
        identity : Principal;
        canisterId : Principal;
        username : Text;
        role : WorkspaceUserRole;
        rolesByBlock : Map.Map<Text, BlockUserRole>;
    };

    public module Services {
        public module CreateActivityService {
            public type CreateActivityServiceInput = {
                id : Nat;
                edits : [ActivitiesTypes.EditItem];
                blockExternalId : BlockId;
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
                uuid : BlockId;
                content : ShareableBlockContent;
                parent : ?BlockId;
                properties : ShareableBlockProperties;
                initialBlockUuid : ?BlockId;
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

        public module PageByUuid {
            public type PageByUuidResult = Result.Result<{ page : ExternalId; recordMap : { blocks : [(ExternalId, ShareableBlock)] } }, { #notFound }>;
        };

        public module Pages {
            public type PagesOptionsArg = {
                cursor : ?PrimaryKey;
                limit : ?Nat;
                order : ?CoreTypes.SortOrder;
            };
            public type PagesOutput = {
                pages : CoreTypes.PaginatedResults<ExternalId>;
                recordMap : { blocks : [(ExternalId, ShareableBlock)] };
            };
        };

        public module Members {
            public type MembersOutput = {
                users : CoreTypes.PaginatedResults<Principal>;
                recordMap : { users : [(Principal, WorkspaceUser)] };
            };
        };

        public module Settings {
            public type SettingsOutput = {
                description : Text;
                name : Text;
                visibility : WorkspaceVisibility;
                websiteLink : Text;
            };
        };
    };

    public module Updates {
        public module AddBlockUpdate {
            public type AddBlockUpdateInput = {
                uuid : BlockId;
                blockType : BlocksTypes.BlockType;
                content : BlocksTypes.ShareableBlockContent;
                parent : ?BlockId;
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
                uuid : BlockId;
                content : BlocksTypes.ShareableBlockContent;
                parent : ?BlockId;
                properties : ShareableBlockProperties;
                initialBlockUuid : ?BlockId;
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
            public type DeletePageUpdateInput = { uuid : BlockId };
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

        public module UpdateSettingsUpdate {
            public type UpdateSettingsUpdateInput = {
                description : ?Text;
                name : ?Text;
                visibility : ?WorkspaceVisibility;
                websiteLink : ?Text;
            };
            public type UpdateSettingsUpdateOutputError = {
                #unauthorized;
            };
            public type UpdateSettingsUpdateOutputOk = ();
            public type UpdateSettingsUpdateOutput = Result.Result<UpdateSettingsUpdateOutputOk, UpdateSettingsUpdateOutputError>;
        };

        public module UpdateUserRoleUpdate {
            public type UpdateUserRoleUpdateInput = {
                user : Principal;
                role : WorkspaceUserRole;
            };
            public type UpdateUserRoleUpdateOutputError = {
                #unauthorized;
            };
            public type UpdateUserRoleUpdateOutputOk = ();
            public type UpdateUserRoleUpdateOutput = Result.Result<UpdateUserRoleUpdateOutputOk, UpdateUserRoleUpdateOutputError>;
        };
    };
};
