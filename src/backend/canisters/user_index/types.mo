import Result "mo:base/Result";

module {
    public type RegisterUserError = {
        #anonymousUser;
        #insufficientCycles;
        #userNotFound;
        #failedToCreateWorkspace;
        #missingUserCanister;
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

};
