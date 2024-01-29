import WorkspaceIndex "canister:workspace_index";

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

import User "../user/main";

import State "./model/state";
import CreateUser "./services/create_user";
import Types "./types";
import CoreTypes "../../types";

actor UserIndex {
    type UserId = Principal;
    stable let MAX_TOP_UP_AMOUNT = Constants.USER__TOP_UP_AMOUNT;
    stable let USER_CAPACITY = Constants.USER__CAPACITY;
    stable let MIN_TOP_UP_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    stable var stable_username_to_user_id : RBTree.Tree<Text, UserId> = #leaf;
    stable var stable_principal_to_user_id : RBTree.Tree<Principal, UserId> = #leaf;
    stable var stable_user_id_to_principal : RBTree.Tree<UserId, Principal> = #leaf;
    stable var stable_user_id_to_user_canister : RBTree.Tree<UserId, User.User> = #leaf;
    stable var stable_topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    stable let stable_capacity = 100_000_000_000_000;
    stable var stable_balance = 0 : Nat;

    var stable_data = {
        username_to_user_id = stable_username_to_user_id;
        principal_to_user_id = stable_principal_to_user_id;
        user_id_to_principal = stable_user_id_to_principal;
        user_id_to_user_canister = stable_user_id_to_user_canister;
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
            case (#ok(#existing(principal, user))) {
                return #ok(principal);
            };
            case (#ok(#created(principal, user))) {
                ignore initializeTopUpsForCanister(principal);
                return #ok(principal);
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

        for (entry in state.data.user_id_to_user_canister.entries()) {
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

        for (entry in state.data.user_id_to_user_canister.entries()) {
            var userId = entry.0;
            var userCanister = entry.1;

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
        let user = switch (state.data.getUserByUserId(caller)) {
            case (null) {
                Debug.trap("Caller is not a registered user");
            };
            case (?user) { user };
        };
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

    private func validateCaller(principal : Principal) : () {
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
        stable_username_to_user_id := state.data.username_to_user_id.share();
        stable_principal_to_user_id := state.data.principal_to_user_id.share();
        stable_user_id_to_principal := state.data.user_id_to_principal.share();
        stable_user_id_to_user_canister := state.data.user_id_to_user_canister.share();
        stable_topUps := topUps.share();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        stable_username_to_user_id := #leaf;
        stable_principal_to_user_id := #leaf;
        stable_user_id_to_principal := #leaf;
        stable_user_id_to_user_canister := #leaf;
        stable_topUps := #leaf;

        doCanisterGeekPostUpgrade();
    };
};
