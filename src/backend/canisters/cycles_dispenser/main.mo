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
import Result "mo:base/Result";
import Canistergeek "mo:canistergeek/canistergeek";

import CanisterTopUp "../../lib/shared/CanisterTopUp";
import Constants "../../constants";
import Types "types";

actor CyclesDispenser {
    type RegisterableCanister = Types.RegisterableCanister;

    stable let CONSTANTS = Constants.Constants();
    stable let USER_INDEX__TOP_UP_AMOUNT = CONSTANTS.USER_INDEX__TOP_UP_AMOUNT.scalar;
    stable let WORKSPACE_INDEX__TOP_UP_AMOUNT = CONSTANTS.WORKSPACE_INDEX__TOP_UP_AMOUNT.scalar;

    stable let MAX_TOP_UP_AMOUNT = 1_000_000_000_000_000;
    stable let MIN_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    stable var stable_balance = 0;
    stable var stable_timerIds : [Timer.TimerId] = [];
    stable var stable_canisters : RbTree.Tree<Principal, RegisterableCanister> = #leaf;
    stable var stable_topUps : RbTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    let canisters = RbTree.RBTree<Principal, RegisterableCanister>(Principal.compare);
    let topUps = RbTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    canisters.unshare(stable_canisters);
    topUps.unshare(stable_topUps);

    type RequestCyclesUpdateOk = {
        accepted : Nat64;
    };

    type RequestCyclesUpdateError = {
        #unauthorized;
        #topUpAlreadyInProgress;
        #amountTooHigh;
        #throttled;
        #insufficientFunds;
    };

    type RequestCyclesUpdateOutput = Result.Result<RequestCyclesUpdateOk, RequestCyclesUpdateError>;

    public shared ({ caller }) func requestCycles(amount : Nat) : async RequestCyclesUpdateOutput {
        let now = Time.now();
        let canister = switch (canisters.get(caller)) {
            case (null) {
                // Canister not registered
                return #err(#unauthorized);
            };
            case (?canister) { canister };
        };
        let result = await depositCycles(canister, amount);

        return result;
    };

    private func depositCycles(
        canister : RegisterableCanister,
        amount : Nat,
    ) : async RequestCyclesUpdateOutput {
        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_INTERVAL;
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
            return #err(#topUpAlreadyInProgress);
        } else if (amount > maxAmount) {
            return #err(#amountTooHigh);
        } else if (shouldThrottle) {
            return #err(#throttled);
        } else {
            CanisterTopUp.setTopUpInProgress(topUp, true);
            ExperimentalCycles.add(amount);
            let result = await canister.walletReceive();
            CanisterTopUp.setTopUpInProgress(topUp, false);
            return #ok(result);
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
        let balance = cyclesInfo.balance;
        let amount = USER_INDEX__TOP_UP_AMOUNT;
        ignore depositCycles(UserIndex, amount);
    };

    private func topUpWorkspaceIndex() : async () {
        let cyclesInfo = await WorkspaceIndex.cyclesInformation();
        let capacity = cyclesInfo.capacity;
        let balance = cyclesInfo.balance;
        let amount = WORKSPACE_INDEX__TOP_UP_AMOUNT;
        ignore depositCycles(UserIndex, amount);
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
     * Canister Monitoring
     *************************************************************************/

    // CanisterGeek
    private let canistergeekMonitor = Canistergeek.Monitor();
    private let canistergeekLogger = Canistergeek.Logger();
    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var _canistergeekLoggerUD : ?Canistergeek.LoggerUpgradeData = null;

    /**
    * Returns canister information based on passed parameters.
    * Called from browser.
    */
    public query ({ caller }) func getCanistergeekInformation(request : Canistergeek.GetInformationRequest) : async Canistergeek.GetInformationResponse {
        Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request);
    };

    /**
    * Updates canister information based on passed parameters at current time.
    * Called from browser or any canister "update" method.
    */
    public shared ({ caller }) func updateCanistergeekInformation(request : Canistergeek.UpdateInformationRequest) : async () {
        canistergeekMonitor.updateInformation(request);
    };

    private func doCanisterGeekPreUpgrade() {
        _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
        _canistergeekLoggerUD := ?canistergeekLogger.preupgrade();
    };

    private func doCanisterGeekPostUpgrade() {
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        _canistergeekMonitorUD := null;

        canistergeekLogger.postupgrade(_canistergeekLoggerUD);
        _canistergeekLoggerUD := null;

        //Optional: override default number of log messages to your value
        canistergeekLogger.setMaxMessagesCount(3000);
    };

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        stable_canisters := canisters.share();
        stable_topUps := topUps.share();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        stable_canisters := #leaf;
        stable_topUps := #leaf;

        // Restart timers
        startRecurringTimers();

        doCanisterGeekPostUpgrade();
    };
};
