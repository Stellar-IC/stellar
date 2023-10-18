import Result "mo:base/Result";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import UUID "mo:uuid/UUID";

module {
    public type PrimaryKey = Nat;
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
};
