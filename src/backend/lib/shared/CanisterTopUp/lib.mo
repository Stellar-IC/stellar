import Time "mo:base/Time";

module CanisterTopUp {
    public type CanisterTopUp = {
        var topUpInProgress : Bool;
        var latestTopUp : ?Time.Time;
    };

    public func setTopUpInProgress(topUp : CanisterTopUp, inProgress : Bool) {
        topUp.topUpInProgress := inProgress;
    };
};
