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
        personalWorkspace : shared () -> async Result.Result<WorkspacesTypes.WorkspaceId, { #anonymousUser; #insufficientCycles; #unauthorized }>;
        upgradePersonalWorkspace : shared (wasm_module : Blob) -> async Result.Result<(), { #failed : Text; #unauthorized; #workspaceNotFound : Text }>;
        walletReceive : shared () -> async Result.Result<{ accepted : Nat64 }, { #unauthorized }>;
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
