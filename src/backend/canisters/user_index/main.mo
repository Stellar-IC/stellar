import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Nat64 "mo:base/Nat64";
import List "mo:base/List";
import Timer "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Int64 "mo:base/Int64";
import Error "mo:base/Error";
import Canistergeek "mo:canistergeek/canistergeek";

import Constants "../../constants";
import CanisterTopUp "../../lib/shared/CanisterTopUp";
import CoreTypes "../../types";

import State "./model/state";
import CreateUser "./services/create_user";
import Types "./types";

actor UserIndex {
    type UserId = Principal;

    stable let CONSTANTS = Constants.Constants();
    stable let USER_CAPACITY = CONSTANTS.USER__CAPACITY;
    stable let MAX_TOP_UP_AMOUNT = CONSTANTS.USER__TOP_UP_AMOUNT.scalar;
    stable let MIN_TOP_UP_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    stable var stable_user_identity_to_canister_id : RBTree.Tree<Principal, UserId> = #leaf;
    stable var stable_user_canister_id_to_identity : RBTree.Tree<UserId, Principal> = #leaf;
    stable var stable_topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    stable let stable_capacity = 100_000_000_000_000;
    stable var stable_balance = 0 : Nat;

    var stable_data = {
        user_identity_to_canister_id = stable_user_identity_to_canister_id;
        user_canister_id_to_identity = stable_user_canister_id_to_identity;
    };

    var state = State.State(State.Data(stable_data));
    let topUps = RBTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    public shared ({ caller }) func registerUser() : async Types.RegisterUserResult {
        if (Principal.isAnonymous(caller)) {
            return #err(#anonymousUser);
        };

        let userIndexPrincipal = Principal.fromActor(UserIndex);
        let result = await CreateUser.execute(state, caller, userIndexPrincipal);

        switch (result) {
            case (#err(#anonymousUser)) {
                return #err(#anonymousUser);
            };
            case (#err(#insufficientCycles)) {
                return #err(#insufficientCycles);
            };
            case (#err(#canisterNotFoundForRegisteredUser)) {
                return #err(#canisterNotFoundForRegisteredUser);
            };
            case (#ok(#existing(owner, user))) {
                return #ok(owner);
            };
            case (#ok(#created(owner, user))) {
                ignore initializeTopUpsForCanister(owner);
                return #ok(owner);
            };
        };
    };

    public shared func updateUserCanisterSettings(userPrincipal : Principal, updatedSettings : CoreTypes.CanisterSettings) : async () {
        let IC0 : CoreTypes.Management = actor "aaaaa-aa";

        let canister_status = await IC0.canister_status({
            canister_id = userPrincipal;
        });
        let memoryAllocation = switch (updatedSettings.memory_allocation) {
            case (null) { canister_status.settings.memory_allocation };
            case (?memoryAllocation) { memoryAllocation };
        };
        let computeAllocation = switch (updatedSettings.compute_allocation) {
            case (null) { canister_status.settings.compute_allocation };
            case (?computeAllocation) { computeAllocation };
        };
        let freezingThreshold = switch (updatedSettings.freezing_threshold) {
            case (null) { canister_status.settings.freezing_threshold };
            case (?freezingThreshold) { freezingThreshold };
        };

        let sender_canister_version : ?Nat64 = null;

        try {
            IC0.update_settings(
                {
                    canister_id = userPrincipal;
                    settings = {
                        controllers = ?canister_status.settings.controllers;
                        compute_allocation = ?computeAllocation;
                        memory_allocation = ?memoryAllocation;
                        freezing_threshold = ?freezingThreshold;
                    };
                    sender_canister_version = sender_canister_version;
                }
            );
        } catch (err) {
            Debug.print("Error updating user canister settings: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
        };

    };

    public shared func upgradeUserCanistersWasm(wasm_module : Blob) {
        let IC0 : CoreTypes.Management = actor "aaaaa-aa";

        let sender_canister_version : ?Nat64 = null;

        for (entry in state.data.user_canister_id_to_identity.entries()) {
            var userId = entry.0;

            try {
                await IC0.install_code(
                    {
                        arg = to_candid (
                            {
                                capacity = USER_CAPACITY;
                                owner = Principal.fromActor(UserIndex);
                            }
                        );
                        canister_id = userId;
                        mode = #upgrade(
                            ?{
                                skip_pre_upgrade = ?false;
                            }
                        );
                        sender_canister_version = sender_canister_version;
                        wasm_module = wasm_module;
                    }
                );
            } catch (err) {
                Debug.print("Error upgrading user canister: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
            };

        };
    };

    public shared func upgradeUserPersonalWorkspaceCanistersWasm(wasm_module : Blob) : async () {
        let IC0 : CoreTypes.Management = actor "aaaaa-aa";

        let sender_canister_version : ?Nat64 = null;

        for (entry in state.data.user_canister_id_to_identity.entries()) {
            var userId = entry.0;
            var userCanister = actor (Principal.toText(userId)) : Types.UserActor;

            try {
                await userCanister.upgradePersonalWorkspaceCanisterWasm(wasm_module);
            } catch (err) {
                Debug.print("Error upgrading user personal workspace canister: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
            };
        };
    };

    // Returns the cycles received up to the capacity allowed
    public func walletReceive() : async { accepted : Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = stable_capacity - stable_balance;
        let accepted = if (amount <= limit) amount else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        stable_balance += accepted;

        return { accepted = Nat64.fromNat(accepted) };
    };

    public shared func cyclesInformation() : async {
        balance : Nat;
        capacity : Nat;
    } {
        return { balance = Cycles.balance(); capacity = stable_capacity };
    };

    public shared ({ caller }) func requestCycles(amount : Nat) : async {
        accepted : Nat64;
    } {
        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_TOP_UP_INTERVAL;
        let currentBalance = Cycles.balance();
        let now = Time.now();
        let user = state.data.getUserByUserId(caller);
        let topUp = switch (topUps.get(caller)) {
            case (null) {
                Debug.trap("Top-ups not set for canister");
            };
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
        } else {
            CanisterTopUp.setTopUpInProgress(topUp, true);
            ExperimentalCycles.add(amount);
            let result = await user.walletReceive();
            CanisterTopUp.setTopUpInProgress(topUp, false);
            return result;
        };
    };

    private func initializeTopUpsForCanister(canisterId : Principal) : CanisterTopUp.CanisterTopUp {
        let topUp : CanisterTopUp.CanisterTopUp = {
            var topUpInProgress = false;
            var latestTopUp = null;
        };
        topUps.put(canisterId, topUp);

        return topUp;
    };

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
        validateCaller(caller);
        Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request);
    };

    /**
    * Updates canister information based on passed parameters at current time.
    * Called from browser or any canister "update" method.
    */
    public shared ({ caller }) func updateCanistergeekInformation(request : Canistergeek.UpdateInformationRequest) : async () {
        validateCaller(caller);
        canistergeekMonitor.updateInformation(request);
    };

    private func validateCaller(owner : Principal) : () {
        //limit access here!
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
        stable_user_identity_to_canister_id := state.data.user_identity_to_canister_id.share();
        stable_user_canister_id_to_identity := state.data.user_canister_id_to_identity.share();
        stable_topUps := topUps.share();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        stable_user_identity_to_canister_id := #leaf;
        stable_user_canister_id_to_identity := #leaf;
        stable_topUps := #leaf;

        doCanisterGeekPostUpgrade();
    };
};
