import UUID "mo:uuid/UUID";
import Time "mo:base/Time";

module {
    public type UserId = Principal;

    public type Edge<DataT> = {
        node : DataT;
    };

    public type PaginatedResults<DataT> = {
        edges : [Edge<DataT>];
    };

    public type SortDirection = {
        #asc;
        #desc;
    };

    public type SortOrder = {
        fieldName : Text;
        direction : SortDirection;
    };

    public module Workspaces {
        public type WorkspaceId = Principal;
        public type WorkspaceName = Text;
        public type WorkspaceDescription = Text;
        public type WorkspaceOwner = Principal;
        public type WorkspaceMember = Principal;

        public type Workspace = {
            uuid : UUID.UUID;
            name : WorkspaceName;
            description : WorkspaceDescription;
            owner : WorkspaceOwner;
            createdAt : Time.Time;
            updatedAt : Time.Time;
        };

        public type WorkspaceInitArgs = {
            capacity : Nat;
            owner : Principal;
        };

        public type WorkspaceInitData = {
            uuid : UUID.UUID;
            name : WorkspaceName;
            description : WorkspaceDescription;
            createdAt : Time.Time;
            updatedAt : Time.Time;
        };
    };
};
