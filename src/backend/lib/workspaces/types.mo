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
    public type MockWorkspaceActor = actor {
        toObject : shared query () -> async Workspace;
        walletReceive : shared () -> async ({ accepted : Nat64 });
        cyclesInformation : () -> async {
            capacity : Nat;
            balance : Nat;
        };
    };

    public type Workspace = {
        uuid : UUID.UUID;
        name : WorkspaceName;
        description : WorkspaceDescription;
        owner : WorkspaceOwner;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    };

    public module Services {
        public module CreateWorkspace {
            public type CreateWorkspaceInput = { owner : WorkspaceOwner };
            public type CreateWorkspaceResult = Result.Result<MockWorkspaceActor, { #anonymousUser; #insufficientCycles }>;
        };
    };
};
