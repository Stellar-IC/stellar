import CoreTypes "../../types";

module {
    public type UserInitArgs = {
        capacity : Nat;
        owner : Principal;
    };

    public type PersonalWorkspace = actor {
        cyclesInformation : () -> async {
            capacity : Nat;
            balance : Nat;
        };
        walletReceive : () -> async {
            accepted : Nat64;
        };
    };
};
