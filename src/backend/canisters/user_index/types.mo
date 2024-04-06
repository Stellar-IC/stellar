import Result "mo:base/Result";

import User "../user/main";

module {
    public type RegisterUserError = {
        #anonymousUser;
        #insufficientCycles;
        #userNotFound;
        #canisterNotFoundForRegisteredUser;
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

    public type CheckUsernameError = {
        #usernameTaken;
    };
    public type CheckUsernameResult = Result.Result<(), CheckUsernameError>;

    public module Services {
        public module CreateUserService {
            public type CreateUserServiceOutput = {
                #created : (Principal, User.User);
                #existing : (Principal, User.User);
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
