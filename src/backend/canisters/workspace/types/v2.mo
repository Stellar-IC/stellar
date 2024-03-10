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

import Types_v1 "./v1";

module {
    public type Block = Types_v1.Block;
    public type ExternalId = Text;
    public type UnsavedBlock = Types_v1.UnsavedBlock;
    public type ShareableBlock = Types_v1.ShareableBlock;
    public type ShareableBlockContent = Types_v1.ShareableBlockContent;
    public type ShareableBlockProperties = Types_v1.ShareableBlockProperties;
    public type BlockEvent = BlocksTypes.BlockEvent;

    public type PrimaryKey = Types_v1.PrimaryKey;
    public type Username = Types_v1.Username;

    public module Services {
        public module CreateActivityService {
            public type CreateActivityServiceInput = Types_v1.Services.CreateActivityService.CreateActivityServiceInput;
            public type CreateActivityServiceOutputError = Types_v1.Services.CreateActivityService.CreateActivityServiceOutputError;
            public type CreateActivityServiceOutput = ActivitiesTypes.Activity;
        };

        public module CreateBlockService {
            public type CreateBlockServiceInput = Types_v1.Services.CreateBlockService.CreateBlockServiceInput;
            public type CreateBlockServiceOutputError = Types_v1.Services.CreateBlockService.CreateBlockServiceOutputError;
            public type CreateBlockServiceOutputResult = Types_v1.Services.CreateBlockService.CreateBlockServiceOutputResult;
            public type CreateBlockServiceOutput = Types_v1.Services.CreateBlockService.CreateBlockServiceOutput;
        };

        public module ExtendActivityService {
            public type ExtendActivityServiceInput = Types_v1.Services.ExtendActivityService.ExtendActivityServiceInput;
            public type ExtendActivityServiceOutput = Types_v1.Services.ExtendActivityService.ExtendActivityServiceOutput;
        };

        public module UpdateBlockService {
            public type UpdateBlockServiceInput = Types_v1.Services.UpdateBlockService.UpdateBlockServiceInput;
            public type UpdateBlockServiceOutputError = Types_v1.Services.UpdateBlockService.UpdateBlockServiceOutputError;
            public type UpdateBlockServiceOutputResult = Types_v1.Services.UpdateBlockService.UpdateBlockServiceOutputResult;
            public type UpdateBlockServiceOutput = Types_v1.Services.UpdateBlockService.UpdateBlockServiceOutput;
        };

        public module DeleteBlockService {
            public type DeleteBlockServiceInput = Types_v1.Services.DeleteBlockService.DeleteBlockServiceInput;
            public type DeleteBlockServiceOutputError = Types_v1.Services.DeleteBlockService.DeleteBlockServiceOutputError;
            public type DeleteBlockServiceOutputResult = Types_v1.Services.DeleteBlockService.DeleteBlockServiceOutputResult;
            public type DeleteBlockServiceOutput = Types_v1.Services.DeleteBlockService.DeleteBlockServiceOutput;
        };

        public module CreatePageService {
            public type CreatePageServiceInput = Types_v1.Services.CreatePageService.CreatePageServiceInput;
            public type CreatePageServiceOutputError = Types_v1.Services.CreatePageService.CreatePageServiceOutputError;
            public type CreatePageServiceOutputResult = Types_v1.Services.CreatePageService.CreatePageServiceOutputResult;
            public type CreatePageServiceOutput = Types_v1.Services.CreatePageService.CreatePageServiceOutput;
        };
    };

    public module Queries {
        public module BlockByUuid {
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
            public type PagesOptionsArg = Types_v1.Queries.Pages.PagesOptionsArg;
            public type PagesResult = {
                pages : CoreTypes.PaginatedResults<ExternalId>;
                recordMap : { blocks : [(ExternalId, ShareableBlock)] };
            };
        };
    };

    public module Updates {
        public module AddBlockUpdate {
            public type AddBlockUpdateInput = Types_v1.Updates.AddBlockUpdate.AddBlockUpdateInput;
            public type AddBlockUpdateOutputError = Types_v1.Updates.AddBlockUpdate.AddBlockUpdateOutputError;
            public type AddBlockUpdateOutputResult = Types_v1.Updates.AddBlockUpdate.AddBlockUpdateOutputResult;
            public type AddBlockUpdateOutput = Types_v1.Updates.AddBlockUpdate.AddBlockUpdateOutput;
        };

        public module CreatePageUpdate {
            public type CreatePageUpdateInput = Types_v1.Updates.CreatePageUpdate.CreatePageUpdateInput;
            public type CreatePageUpdateOutputError = Types_v1.Updates.CreatePageUpdate.CreatePageUpdateOutputError;
            public type CreatePageUpdateOutputResult = Types_v1.Updates.CreatePageUpdate.CreatePageUpdateOutputResult;
            public type CreatePageUpdateOutput = Types_v1.Updates.CreatePageUpdate.CreatePageUpdateOutput;
        };

        public module UpdateBlockUpdate {
            public type UpdateBlockUpdateInput = Types_v1.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput;
            public type UpdateBlockUpdateOutputError = Types_v1.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutputError;
            public type UpdateBlockUpdateOutputResult = Types_v1.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutputResult;
            public type UpdateBlockUpdateOutput = Types_v1.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput;
        };

        public module DeletePageUpdate {
            public type DeletePageUpdateInput = Types_v1.Updates.DeletePageUpdate.DeletePageUpdateInput;
            public type DeletePageUpdateOutputError = Types_v1.Updates.DeletePageUpdate.DeletePageUpdateOutputError;
            public type DeletePageUpdateOutputResult = Types_v1.Updates.DeletePageUpdate.DeletePageUpdateOutputResult;
            public type DeletePageUpdateOutput = Types_v1.Updates.DeletePageUpdate.DeletePageUpdateOutput;
        };

        public module SaveEventTransactionUpdate {
            public type SaveEventTransactionUpdateInput = Types_v1.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput;
            public type SaveEventTransactionUpdateOutputError = Types_v1.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutputError;
            public type SaveEventTransactionUpdateOutputResult = Types_v1.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutputResult;
            public type SaveEventTransactionUpdateOutput = Types_v1.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput;
        };
    };
};
