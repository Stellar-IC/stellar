import Result "mo:base/Result";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import UUID "mo:uuid/UUID";

module {
    public type PrimaryKey = Nat;
    public type WorkspaceId = Principal;
    public type WorkspaceName = Text;
    public type WorkspaceDescription = Text;
    public type WorkspaceOwner = Principal;
    public type WorkspaceMember = Principal;

    public type WorkspaceInitArgs = {
        capacity : Nat;
        owner : Principal;
    };

    public type WorkspaceInitData = {
        uuid : UUID.UUID;
        name : Text;
        description : Text;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    };

    public type MockWorkspaceActor = actor {
        toObject : shared query () -> async Workspace;
        walletReceive : shared () -> async ({ accepted : Nat64 });
        getInitArgs : shared query () -> async Result.Result<WorkspaceInitArgs, { #unauthorized }>;
        getInitData : shared query () -> async Result.Result<WorkspaceInitData, { #unauthorized }>;
    };

    public type Workspace = {
        uuid : UUID.UUID;
        name : WorkspaceName;
        description : WorkspaceDescription;
        owner : WorkspaceOwner;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    };

    public type WorkspaceVisibility = {
        #open;
        #closed;
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
        public module CreateWorkspace {
            public type CreateWorkspaceInput = {
                owner : WorkspaceOwner;
                controllers : [Principal];
                initialUsers : [(
                    Principal,
                    WorkspaceUser,
                )];
            };
            public type CreateWorkspaceOutput = Result.Result<MockWorkspaceActor, { #anonymousUser; #insufficientCycles }>;
        };
    };
};
