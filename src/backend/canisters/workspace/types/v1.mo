import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import ActivitiesTypes "../../../lib/activities/types";
import BlocksTypes "../../../lib/blocks/types";
import EventsTypes "../../../lib/events/types";

import Types_v0 "./v0";

module {
    public type Block = Types_v0.Block;
    public type UnsavedBlock = Types_v0.UnsavedBlock;
    public type ShareableBlock = Types_v0.ShareableBlock;
    public type ShareableBlockContent = Types_v0.ShareableBlockContent;
    public type ShareableBlockProperties = Types_v0.ShareableBlockProperties;
    public type BlockEvent = BlocksTypes.BlockEvent;

    public type PrimaryKey = Types_v0.PrimaryKey;
    public type Username = Types_v0.Username;

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
            public type CreateBlockServiceInput = Types_v0.Services.CreateBlockService.CreateBlockServiceInput;
            public type CreateBlockServiceOutputError = Types_v0.Services.CreateBlockService.CreateBlockServiceOutputError;
            public type CreateBlockServiceOutputResult = Types_v0.Services.CreateBlockService.CreateBlockServiceOutputResult;
            public type CreateBlockServiceOutput = Types_v0.Services.CreateBlockService.CreateBlockServiceOutput;
        };

        public module ExtendActivityService {
            public type ExtendActivityServiceInput = {
                activityId : Nat;
                edits : [ActivitiesTypes.EditItem];
            };
            public type ExtendActivityServiceOutput = ActivitiesTypes.Activity;
        };

        public module UpdateBlockService {
            public type UpdateBlockServiceInput = Types_v0.Services.UpdateBlockService.UpdateBlockServiceInput;
            public type UpdateBlockServiceOutputError = Types_v0.Services.UpdateBlockService.UpdateBlockServiceOutputError;
            public type UpdateBlockServiceOutputResult = Types_v0.Services.UpdateBlockService.UpdateBlockServiceOutputResult;
            public type UpdateBlockServiceOutput = Types_v0.Services.UpdateBlockService.UpdateBlockServiceOutput;
        };

        public module DeleteBlockService {
            public type DeleteBlockServiceInput = Types_v0.Services.DeleteBlockService.DeleteBlockServiceInput;
            public type DeleteBlockServiceOutputError = Types_v0.Services.DeleteBlockService.DeleteBlockServiceOutputError;
            public type DeleteBlockServiceOutputResult = Types_v0.Services.DeleteBlockService.DeleteBlockServiceOutputResult;
            public type DeleteBlockServiceOutput = Types_v0.Services.DeleteBlockService.DeleteBlockServiceOutput;
        };

        public module CreatePageService {
            public type CreatePageServiceInput = Types_v0.Services.CreatePageService.CreatePageServiceInput;
            public type CreatePageServiceOutputError = Types_v0.Services.CreatePageService.CreatePageServiceOutputError;
            public type CreatePageServiceOutputResult = Types_v0.Services.CreatePageService.CreatePageServiceOutputResult;
            public type CreatePageServiceOutput = Types_v0.Services.CreatePageService.CreatePageServiceOutput;
        };
    };

    public module Queries {
        public module BlockByUuid {
            public type BlockByUuidResult = Types_v0.Queries.BlockByUuid.BlockByUuidResult;
        };

        public module BlocksByPageUuid {
            public type BlocksByPageUuidResult = Types_v0.Queries.BlocksByPageUuid.BlocksByPageUuidResult;
        };

        public module PageByUuid {
            public type PageByUuidResult = Result.Result<{ page : { uuid : UUID.UUID }; _records : { blocks : [ShareableBlock] } }, { #pageNotFound }>;
        };

        public module Pages {
            public type PagesOptionsArg = Types_v0.Queries.Pages.PagesOptionsArg;
            public type PagesResult = Types_v0.Queries.Pages.PagesResult;
        };
    };

    public module Updates {
        public module AddBlockUpdate {
            public type AddBlockUpdateInput = Types_v0.Updates.AddBlockUpdate.AddBlockUpdateInput;
            public type AddBlockUpdateOutputError = Types_v0.Updates.AddBlockUpdate.AddBlockUpdateOutputError;
            public type AddBlockUpdateOutputResult = Types_v0.Updates.AddBlockUpdate.AddBlockUpdateOutputResult;
            public type AddBlockUpdateOutput = Types_v0.Updates.AddBlockUpdate.AddBlockUpdateOutput;
        };

        public module CreatePageUpdate {
            public type CreatePageUpdateInput = Types_v0.Updates.CreatePageUpdate.CreatePageUpdateInput;
            public type CreatePageUpdateOutputError = Types_v0.Updates.CreatePageUpdate.CreatePageUpdateOutputError;
            public type CreatePageUpdateOutputResult = Types_v0.Updates.CreatePageUpdate.CreatePageUpdateOutputResult;
            public type CreatePageUpdateOutput = Types_v0.Updates.CreatePageUpdate.CreatePageUpdateOutput;
        };

        public module UpdateBlockUpdate {
            public type UpdateBlockUpdateInput = Types_v0.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput;
            public type UpdateBlockUpdateOutputError = Types_v0.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutputError;
            public type UpdateBlockUpdateOutputResult = Types_v0.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutputResult;
            public type UpdateBlockUpdateOutput = Types_v0.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput;
        };

        public module DeletePageUpdate {
            public type DeletePageUpdateInput = Types_v0.Updates.DeletePageUpdate.DeletePageUpdateInput;
            public type DeletePageUpdateOutputError = Types_v0.Updates.DeletePageUpdate.DeletePageUpdateOutputError;
            public type DeletePageUpdateOutputResult = Types_v0.Updates.DeletePageUpdate.DeletePageUpdateOutputResult;
            public type DeletePageUpdateOutput = Types_v0.Updates.DeletePageUpdate.DeletePageUpdateOutput;
        };

        public module SaveEventTransactionUpdate {
            public type SaveEventTransactionUpdateInput = Types_v0.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput;
            public type SaveEventTransactionUpdateOutputError = Types_v0.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutputError;
            public type SaveEventTransactionUpdateOutputResult = Types_v0.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutputResult;
            public type SaveEventTransactionUpdateOutput = Types_v0.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput;
        };
    };
};
