import Result "mo:base/Result";

module {
    public type RegisterUserError = {
        #anonymousUser;
        #insufficientCycles;
        #userNotFound;
        #canisterNotFoundForRegisteredUser;
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

};
