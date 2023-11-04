import Result "mo:base/Result";

module {
    public type RegisterUserError = {
        #anonymousUser;
        #insufficientCycles;
        #userNotFound;
        #missingUserCanister;
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

};
