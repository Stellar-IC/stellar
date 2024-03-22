import Result "mo:base/Result";
import WorkspacesTypes "../../lib/workspaces/types";

module {
    public type RegisterUserError = {
        #anonymousUser;
        #insufficientCycles;
        #userNotFound;
        #canisterNotFoundForRegisteredUser;
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

    public type UserActor = actor {
        upgradePersonalWorkspace : (wasm_module : Blob) -> async Result.Result<(), { #unauthorized }>;
        walletReceive : () -> async Result.Result<{ accepted : Nat64 }, { #failed : Text; #unauthorized; #workspaceNotFound : Text }>;
        personalWorkspace : () -> async Result.Result<WorkspacesTypes.WorkspaceId, { #anonymousUser; #insufficientCycles; #unauthorized }>;
    };

    public module Services {
        public module CreateUserService {
            public type CreateUserServiceOutput = {
                #created : (Principal, UserActor);
                #existing : (Principal, UserActor);
            };
            public type CreateUserServiceError = {
                #anonymousUser;
                #insufficientCycles;
                #canisterNotFoundForRegisteredUser;
            };
            public type CreateUserServiceResult = Result.Result<CreateUserServiceOutput, CreateUserServiceError>;
        };
    };
};
