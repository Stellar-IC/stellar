import Nat64 "mo:base/Nat64";
import ExperimentalCycles "mo:base/ExperimentalCycles";

module CyclesUtils {
    public func walletReceive(limit : Nat) : async { accepted : Nat64 } {
        let amount = ExperimentalCycles.available();
        let accepted = if (amount <= limit) amount else limit;
        let deposit = ExperimentalCycles.accept(accepted);
        assert (deposit == accepted);

        return { accepted = Nat64.fromNat(accepted) };
    };
};
