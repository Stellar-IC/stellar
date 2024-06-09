import Result "mo:base/Result";

import User "../user/main";

module {
    public type RegisterUserError = {
        #AnonymousOwner;
        #InsufficientCycles;
        #WorkspaceIndexNotFound;
        #WorkspaceCreationFailed : {
            #AnonymousOwner;
            #InsufficientCycles;
        };
        #UserWorkspaceAssignmentFailed : {
            #AnonymousOwner;
            #InsufficientCycles;
        };
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

    public type CheckUsernameError = {
        #UsernameTaken;
    };
    public type CheckUsernameResult = Result.Result<(), CheckUsernameError>;

    module Services {
        public type CreateUserServiceOutput = {
            #Created : Principal;
            #Existing : Principal;
        };
        public type CreateUserServiceError = {
            #AnonymousOwner;
            #InsufficientCycles;
        };
        public type CreateUserServiceResult = Result.Result<CreateUserServiceOutput, CreateUserServiceError>;
    };
};
