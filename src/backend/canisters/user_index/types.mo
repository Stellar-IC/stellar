import Result "mo:base/Result";

import User "../user/main";

module {
    public type RegisterUserError = {
        #AnonymousOwner;
        #InsufficientCycles;
        #LoginDisabled;
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

    public module Services {
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

    public module Queries {
        public type UserDetailsByIdentityResult = Result.Result<{ canisterId : Principal; username : Text }, { #userNotFound }>;
    };
};
