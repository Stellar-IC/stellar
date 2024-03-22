import Principal "mo:base/Principal";
import RbTree "mo:base/RBTree";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import Timer "mo:base/Timer";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Canistergeek "mo:canistergeek/canistergeek";

import CanisterTopUp "../../lib/shared/CanisterTopUp";
import Constants "../../constants";
import AuthUtils "../../utils/auth";

import Types "./types";

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

    public shared ({ caller }) func requestCycles(amount : Nat) : async RequestCyclesUpdateOutput {
        if (isRegisteredCanister(caller) == false) {
            return #err(#unauthorized);
        };

        let now = Time.now();
        let canister = switch (canisters.get(caller)) {
            case (null) { return #err(#unauthorized) };
            case (?canister) { canister };
        };
        let result = await depositCycles(canister, amount);

        return result;
    };

    public shared ({ caller }) func register(canisterId : Principal) : async Result.Result<(), { #unauthorized }> {
        if (AuthUtils.isDev(caller) == false) {
            return #err(#unauthorized);
        };

        let existingCanister = canisters.get(canisterId);

        if (existingCanister == null) {
            let canister : RegisterableCanister = actor (Principal.toText(canisterId));
            canisters.put(canisterId, canister);
            initializeTopUpsForCanister(canisterId);
        };

        #ok;
    };

    private func isRegisteredCanister(canisterId : Principal) : Bool {
        switch (canisters.get(canisterId)) {
            case (null) { false };
            case (?canister) { true };
        };
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

    private func initializeTopUpsForCanister(canisterId : Principal) : () {
        topUps.put(
            canisterId,
            {
                var topUpInProgress = false;
                var latestTopUp = null;
            },
        );
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

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        stable_canisters := canisters.share();
        stable_topUps := topUps.share();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        canisters.unshare(stable_canisters);
        topUps.unshare(stable_topUps);

        stable_canisters := #leaf;
        stable_topUps := #leaf;

        doCanisterGeekPostUpgrade();
    };
};
