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

    public type PageAccessLevel = {
        #full;
        #edit;
        #view;
        #none;
    };

    public type PageAccessSetting = {
        #invited;
        #workspaceMember : PageAccessLevel;
        #everyone : PageAccessLevel;
    };

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

        public module PageAccessSettings {
            public type PageAccessSettingsOutput = PageAccessSetting;
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
        public module AddBlock {
            public type AddBlockInput = {
                uuid : BlockId;
                blockType : BlocksTypes.BlockType;
                content : BlocksTypes.ShareableBlockContent;
                parent : ?BlockId;
                properties : BlocksTypes.ShareableBlockProperties;
            };
            public type AddBlockOutputError = { #unauthorized };
            public type AddBlockOutputResult = ();
            public type AddBlockOutput = Result.Result<AddBlockOutputResult, AddBlockOutputError>;
        };

        public module AddUsers {
            public type AddUsersInput = [(Principal, WorkspaceUser)];
            public type AddUsersResult = Result.Result<(), { #unauthorized }>;
        };

        public module CreatePage {
            public type CreatePageInput = {
                uuid : BlockId;
                content : BlocksTypes.ShareableBlockContent;
                parent : ?BlockId;
                properties : ShareableBlockProperties;
                initialBlockUuid : ?BlockId;
            };
            public type CreatePageOutputError = {
                #anonymousUser;
                #failedToCreate;
                #inputTooLong;
                #invalidBlockType;
                #insufficientCycles;
            };
            public type CreatePageOutputResult = ShareableBlock;
            public type CreatePageOutput = Result.Result<CreatePageOutputResult, CreatePageOutputError>;
        };

        public module DeletePage {
            public type DeletePageInput = { uuid : BlockId };
            public type DeletePageOutputError = ();
            public type DeletePageOutputResult = ();
            public type DeletePageOutput = Result.Result<DeletePageOutputResult, DeletePageOutputError>;
        };

        public module SaveEventTransaction {
            public type SaveEventTransactionInput = {
                transaction : BlocksTypes.BlockEventTransaction;
            };
            public type SaveEventTransactionOutputError = {
                #anonymousUser;
                #insufficientCycles;
            };
            public type SaveEventTransactionOutputResult = ();
            public type SaveEventTransactionOutput = Result.Result<SaveEventTransactionOutputResult, SaveEventTransactionOutputError>;
        };

        public module SetPageAccess {
            public type SetPageAccessInput = {
                pageId : BlockId;
                access : PageAccessSetting;
            };
            public type SetPageAccessOutputError = {
                #unauthorized;
            };
            public type SetPageAccessOutputResult = ();
            public type SetPageAccessOutput = Result.Result<SetPageAccessOutputResult, SetPageAccessOutputError>;
        };

        public module UpdateBlock {
            public type UpdateBlockInput = ShareableBlock;
            public type UpdateBlockOutputError = {
                #primaryKeyAttrNotFound;
            };
            public type UpdateBlockOutputResult = ShareableBlock;
            public type UpdateBlockOutput = Result.Result<UpdateBlockOutputResult, UpdateBlockOutputError>;
        };

        public module UpdateSettings {
            public type UpdateSettingsInput = {
                description : ?Text;
                name : ?Text;
                visibility : ?WorkspaceVisibility;
                websiteLink : ?Text;
            };
            public type UpdateSettingsOutputError = {
                #unauthorized;
            };
            public type UpdateSettingsOutputOk = ();
            public type UpdateSettingsOutput = Result.Result<UpdateSettingsOutputOk, UpdateSettingsOutputError>;
        };

        public module UpdateUserRole {
            public type UpdateUserRoleInput = {
                user : Principal;
                role : WorkspaceUserRole;
            };
            public type UpdateUserRoleOutputError = {
                #unauthorized;
            };
            public type UpdateUserRoleOutputOk = ();
            public type UpdateUserRoleOutput = Result.Result<UpdateUserRoleOutputOk, UpdateUserRoleOutputError>;
        };
    };
};
