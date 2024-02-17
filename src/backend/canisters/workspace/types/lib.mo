import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import Types "./v0";

module {
    public type PrimaryKey = Types.PrimaryKey;
    public type Username = Types.Username;

    public module Services {
        public module CreateBlockService {
            public type CreateBlockServiceInput = Types.Services.CreateBlockService.CreateBlockServiceInput;
            public type CreateBlockServiceOutputError = Types.Services.CreateBlockService.CreateBlockServiceOutputError;
            public type CreateBlockServiceOutputResult = Types.Services.CreateBlockService.CreateBlockServiceOutputResult;
            public type CreateBlockServiceOutput = Types.Services.CreateBlockService.CreateBlockServiceOutput;
        };

        public module UpdateBlockService {
            public type UpdateBlockServiceInput = Types.Services.UpdateBlockService.UpdateBlockServiceInput;
            public type UpdateBlockServiceOutputError = Types.Services.UpdateBlockService.UpdateBlockServiceOutputError;
            public type UpdateBlockServiceOutputResult = Types.Services.UpdateBlockService.UpdateBlockServiceOutputResult;
            public type UpdateBlockServiceOutput = Types.Services.UpdateBlockService.UpdateBlockServiceOutput;
        };

        public module DeleteBlockService {
            public type DeleteBlockServiceInput = Types.Services.DeleteBlockService.DeleteBlockServiceInput;
            public type DeleteBlockServiceOutputError = Types.Services.DeleteBlockService.DeleteBlockServiceOutputError;
            public type DeleteBlockServiceOutputResult = Types.Services.DeleteBlockService.DeleteBlockServiceOutputResult;
            public type DeleteBlockServiceOutput = Types.Services.DeleteBlockService.DeleteBlockServiceOutput;
        };

        public module CreatePageService {
            public type CreatePageServiceInput = Types.Services.CreatePageService.CreatePageServiceInput;
            public type CreatePageServiceOutputError = Types.Services.CreatePageService.CreatePageServiceOutputError;
            public type CreatePageServiceOutputResult = Types.Services.CreatePageService.CreatePageServiceOutputResult;
            public type CreatePageServiceOutput = Types.Services.CreatePageService.CreatePageServiceOutput;
        };
    };

    public module Queries {
        public module BlockByUuid {
            public type BlockByUuidResult = Types.Queries.BlockByUuid.BlockByUuidResult;
        };
        public module BlocksByPageUuid {
            public type BlocksByPageUuidResult = Types.Queries.BlocksByPageUuid.BlocksByPageUuidResult;
        };
        public module PageByUuid {
            public type PageByUuidResult = Types.Queries.PageByUuid.PageByUuidResult;
        };
        public module Pages {
            public type PagesOptionsArg = Types.Queries.Pages.PagesOptionsArg;
            public type PagesResult = Types.Queries.Pages.PagesResult;
        };
    };

    public module Updates {
        public module AddBlockUpdate {
            public type AddBlockUpdateInput = Types.Updates.AddBlockUpdate.AddBlockUpdateInput;
            public type AddBlockUpdateOutputError = Types.Updates.AddBlockUpdate.AddBlockUpdateOutputError;
            public type AddBlockUpdateOutputResult = Types.Updates.AddBlockUpdate.AddBlockUpdateOutputResult;
            public type AddBlockUpdateOutput = Types.Updates.AddBlockUpdate.AddBlockUpdateOutput;
        };

        public module CreatePageUpdate {
            public type CreatePageUpdateInput = Types.Updates.CreatePageUpdate.CreatePageUpdateInput;
            public type CreatePageUpdateOutputError = Types.Updates.CreatePageUpdate.CreatePageUpdateOutputError;
            public type CreatePageUpdateOutputResult = Types.Updates.CreatePageUpdate.CreatePageUpdateOutputResult;
            public type CreatePageUpdateOutput = Types.Updates.CreatePageUpdate.CreatePageUpdateOutput;
        };

        public module UpdateBlockUpdate {
            public type UpdateBlockUpdateInput = Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput;
            public type UpdateBlockUpdateOutputError = Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutputError;
            public type UpdateBlockUpdateOutputResult = Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutputResult;
            public type UpdateBlockUpdateOutput = Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput;
        };

        public module DeletePageUpdate {
            public type DeletePageUpdateInput = Types.Updates.DeletePageUpdate.DeletePageUpdateInput;
            public type DeletePageUpdateOutputError = Types.Updates.DeletePageUpdate.DeletePageUpdateOutputError;
            public type DeletePageUpdateOutputResult = Types.Updates.DeletePageUpdate.DeletePageUpdateOutputResult;
            public type DeletePageUpdateOutput = Types.Updates.DeletePageUpdate.DeletePageUpdateOutput;
        };

        public module SaveEventTransactionUpdate {
            public type SaveEventTransactionUpdateInput = Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput;
            public type SaveEventTransactionUpdateOutputError = Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutputError;
            public type SaveEventTransactionUpdateOutputResult = Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutputResult;
            public type SaveEventTransactionUpdateOutput = Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput;
        };
    };
};
