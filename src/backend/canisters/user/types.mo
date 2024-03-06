import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import CoreTypes "../../types";
import WorkspacesTypes "../../lib/workspaces/types";

module {
    public type UserInitArgs = {
        capacity : Nat;
        owner : Principal;
    };

    public type PersonalWorkspace = actor {
        cyclesInformation : () -> async {
            capacity : Nat;
            balance : Nat;
        };
        walletReceive : () -> async {
            accepted : Nat64;
        };
        getInitArgs() : async WorkspacesTypes.WorkspaceInitArgs;
        getInitData() : async {
            uuid : UUID.UUID;
            name : CoreTypes.Workspaces.WorkspaceName;
            description : CoreTypes.Workspaces.WorkspaceDescription;
            createdAt : Time.Time;
            updatedAt : Time.Time;
        };
    };
};
