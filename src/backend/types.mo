import UUID "mo:uuid/UUID";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";
import Bool "mo:base/Bool";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import Int64 "mo:base/Int64";

module {
    type CanisterId = Principal;
    public type CanisterSettings = {
        controllers : ?[Principal];
        compute_allocation : ?Nat;
        memory_allocation : ?Nat;
        freezing_threshold : ?Nat;
    };
    public type DefiniteCanisterSettings = {
        controllers : [Principal];
        compute_allocation : Nat;
        memory_allocation : Nat;
        freezing_threshold : Nat;
    };
    type WasmModule = Blob;

    public type Management = actor {
        canister_status : { canister_id : Principal } -> async {
            settings : DefiniteCanisterSettings;
        };
        update_settings : (
            {
                canister_id : Principal;
                settings : CanisterSettings;
                sender_canister_version : ?Nat64;
            }
        ) -> ();
        install_code : (
            {
                mode : {
                    #install;
                    #reinstall;
                    #upgrade : ?{
                        skip_pre_upgrade : ?Bool;
                    };
                };
                canister_id : CanisterId;
                wasm_module : WasmModule;
                arg : Blob;
                sender_canister_version : ?Nat64;
            }
        ) -> async ();
    };

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
            createdAt : Time.Time;
            description : WorkspaceDescription;
            name : WorkspaceName;
            updatedAt : Time.Time;
        };

        public type WorkspaceInitArgs = {
            capacity : Nat;
            createdAt : Time.Time;
            description : WorkspaceDescription;
            name : WorkspaceName;
            uuid : UUID.UUID;
            updatedAt : Time.Time;
            userIndexCanisterId : CanisterId;
            owners : [WorkspaceOwner];
        };
    };

    public module User {
        public type PublicUserProfile = {
            username : Text;
            avatarUrl : ?Text;
        };
    };
};
