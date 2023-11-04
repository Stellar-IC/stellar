module {
    public type RegisterableCanister = actor {
        walletReceive() : async { accepted : Nat64 };
    };
};
