import Result "mo:base/Result";

module {
    public type RegisterUserError = {
        #anonymousUser;
        #insufficientCycles;
        #userNotFound;
        #canisterNotFoundForRegisteredUser;
    };
    public type RegisterUserResult = Result.Result<Principal, RegisterUserError>;

    public type UserActor = actor {
        upgradePersonalWorkspaceCanisterWasm : (wasm_module : Blob) -> async ();
        walletReceive : () -> async {
            accepted : Nat64;
        };
    };
};
