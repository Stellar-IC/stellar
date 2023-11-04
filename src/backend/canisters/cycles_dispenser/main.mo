import UserIndex "canister:user_index";
import WorkspaceIndex "canister:workspace_index";

import Principal "mo:base/Principal";
import RbTree "mo:base/RBTree";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Timer "mo:base/Timer";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

import CanisterTopUp "../../lib/shared/CanisterTopUp";
import Constants "../../constants";
import Types "types";

actor CyclesDispenser {
    type RegisterableCanister = Types.RegisterableCanister;

    stable var capacity = 100_000_000_000_000;
    stable var balance = 0;
    stable let MAX_TOP_UP_AMOUNT = 1_000_000_000_000_000;
    stable let MIN_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours
    stable let MIN_BALANCE = 10_000_000_000_000; // 10 cycles

    stable var stable_timerIds : [Timer.TimerId] = [];
    stable var stable_canisters : RbTree.Tree<Principal, RegisterableCanister> = #leaf;
    stable var stable_topUps : RbTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    let canisters = RbTree.RBTree<Principal, RegisterableCanister>(Principal.compare);
    let topUps = RbTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    canisters.unshare(stable_canisters);
    topUps.unshare(stable_topUps);

    public shared ({ caller }) func requestCycles(amount : Nat) : async {
        accepted : Nat64;
    } {
        let now = Time.now();
        let canister = switch (canisters.get(caller)) {
            case (null) { Debug.trap("Canister not registered") };
            case (?canister) { canister };
        };
        return await depositCycles(canister, amount);
    };

    private func depositCycles(
        canister : RegisterableCanister,
        amount : Nat,
    ) : async {
        accepted : Nat64;
    } {
        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_INTERVAL;
        let minBalance = MIN_BALANCE;
        let now = Time.now();
        let topUp = switch (topUps.get((Principal.fromActor(canister)))) {
            case (null) { Debug.trap("Top-ups not set for canister") };
            case (?topUp) { topUp };
        };
        let shouldThrottle = switch (topUp.latestTopUp) {
            case (null) { false };
            case (?latestTopUp) { latestTopUp + minInterval > now };
        };

        if (topUp.topUpInProgress) {
            Debug.trap("Top up in progress");
        } else if (amount > maxAmount) {
            Debug.trap("Amount too high");
        } else if (shouldThrottle) {
            Debug.trap("Throttled");
        } else if (balance < minBalance + amount) {
            Debug.trap("Balance too low");
        } else {
            CanisterTopUp.setTopUpInProgress(topUp, true);
            ExperimentalCycles.add(amount);
            let result = await canister.walletReceive();
            CanisterTopUp.setTopUpInProgress(topUp, false);
            return result;
        };
    };

    private func registerKnownCanisters() {
        register(UserIndex);
        register(WorkspaceIndex);
    };

    private func register(canister : RegisterableCanister) {
        let canisterId = Principal.fromActor(canister);
        let existingCanister = canisters.get(canisterId);
        if (existingCanister == null) {
            canisters.put(canisterId, canister);
            initializeTopUpsForCanister(canisterId);
        };
    };

    private func initializeTopUpsForCanister(canisterId : Principal) : () {
        let topUp : CanisterTopUp.CanisterTopUp = {
            var topUpInProgress = false;
            var latestTopUp = null;
        };
        topUps.put(canisterId, topUp);
    };

    private func topUpKnownCanisters() : async () {
        await topUpUserIndex();
        await topUpWorkspaceIndex();
    };

    private func topUpUserIndex() : async () {
        let cyclesInfo = await UserIndex.cyclesInformation();
        let capacity = cyclesInfo.capacity;
        let balance = cyclesInfo.balance;

        if (balance < Constants.USER_INDEX__MIN_BALANCE) {
            let amount = Constants.USER_INDEX__TOP_UP_AMOUNT;
            ignore depositCycles(UserIndex, amount);
        };
    };

    private func topUpWorkspaceIndex() : async () {
        let cyclesInfo = await WorkspaceIndex.cyclesInformation();
        let capacity = cyclesInfo.capacity;
        let balance = cyclesInfo.balance;

        if (balance < Constants.WORKSPACE_INDEX__MIN_BALANCE) {
            let amount = Constants.WORKSPACE_INDEX__TOP_UP_AMOUNT;
            ignore depositCycles(UserIndex, amount);
        };
    };

    private func startRecurringTimers() {
        ignore Timer.recurringTimer(
            #seconds(60),
            topUpKnownCanisters,
        );
    };

    ignore Timer.setTimer(
        #nanoseconds(0),
        func() : async () { registerKnownCanisters() },
    );

    ignore Timer.setTimer(
        #nanoseconds(0),
        func() : async () { startRecurringTimers() },
    );

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        stable_canisters := canisters.share();
        stable_topUps := topUps.share();
    };

    system func postupgrade() {
        stable_canisters := #leaf;
        stable_topUps := #leaf;

        // Restart timers
        startRecurringTimers();
    };
};
