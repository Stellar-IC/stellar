import Result "mo:base/Result";
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
        walletReceive : shared () -> async ({ accepted : Nat64 });
        getInitArgs : shared query () -> async Result.Result<WorkspacesTypes.WorkspaceInitArgs, { #unauthorized }>;
        getInitData : shared query () -> async Result.Result<WorkspacesTypes.WorkspaceInitData, { #unauthorized }>;
    };
};
