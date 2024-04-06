import CyclesDispenser "canister:cycles_dispenser";

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
import AuthUtils "../../utils/auth";
import CanisterTopUp "../../lib/shared/CanisterTopUp";
import CoreTypes "../../types";
import User "../user/main";
import UserTypes "../user/types";

import CreateUser "./services/create_user";
import State "./state";
import Types "./types";

actor UserIndex {
    type UserId = Principal;

    stable let CONSTANTS = Constants.Constants();
    stable let USER_CAPACITY = CONSTANTS.USER__CAPACITY.scalar;
    stable let MAX_TOP_UP_AMOUNT = CONSTANTS.USER__TOP_UP_AMOUNT.scalar;
    stable let MIN_TOP_UP_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    stable var stable_user_identity_to_canister_id : RBTree.Tree<Principal, UserId> = #leaf;
    stable var stable_user_canister_id_to_identity : RBTree.Tree<UserId, Principal> = #leaf;
    stable var stable_username_to_user_id : RBTree.Tree<Text, UserId> = #leaf;
    stable var stable_topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    stable let stable_capacity = 100_000_000_000_000;
    stable var stable_balance = 0 : Nat;

    var stable_data = {
        user_identity_to_canister_id = stable_user_identity_to_canister_id;
        user_canister_id_to_identity = stable_user_canister_id_to_identity;
        username_to_user_id = stable_username_to_user_id;
    };

    var state = State.State(State.Data(stable_data));
    let topUps = RBTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    public shared ({ caller }) func registerUser() : async Types.RegisterUserResult {
        if (Principal.isAnonymous(caller)) {
            return #err(#anonymousUser);
        };

        let result = await CreateUser.execute(state, caller, Principal.fromActor(UserIndex));

        switch (result) {
            case (#err(err)) { return #err(err) };
            case (#ok(#existing(userId, user))) { return #ok(userId) };
            case (#ok(#created(userId, user))) {
                initializeTopUpsForCanister(userId);
                await user.subscribe(#profileUpdated, onUserEvent);
                return #ok(userId);
            };
        };
    };

    public shared ({ caller }) func onUserEvent(event : UserTypes.UserEvent) : async () {
        if (state.data.user_canister_id_to_identity.get(caller) == null) {
            // caller is not a registered user
            return;
        };

        switch (event.event) {
            case (#profileUpdated(data)) {
                state.data.username_to_user_id.put(data.profile.username, caller);
            };
        };
    };

    public query func checkUsername(username : Text) : async Types.CheckUsernameResult {
        return state.data.checkUsername(username);
    };

    public shared ({ caller }) func upgradeUsers(wasm_module : Blob) : async Result.Result<(), { #unauthorized }> {
        if ((AuthUtils.isDev(caller)) == false) {
            return #err(#unauthorized);
        };

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
                        mode = #upgrade(?{ skip_pre_upgrade = ?false });
                        sender_canister_version = sender_canister_version;
                        wasm_module = wasm_module;
                    }
                );
            } catch (err) {
                Debug.print("Error upgrading user canister: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
            };
        };

        #ok;
    };

    public shared ({ caller }) func upgradePersonalWorkspaces(wasm_module : Blob) : async Result.Result<(), { #failed : Text; #unauthorized; #workspaceNotFound : Text }> {
        if ((AuthUtils.isDev(caller)) == false) {
            return #err(#unauthorized);
        };

        let IC0 : CoreTypes.Management = actor "aaaaa-aa";
        let sender_canister_version : ?Nat64 = null;

        for (entry in state.data.user_canister_id_to_identity.entries()) {
            var userId = entry.0;
            var userCanister = actor (Principal.toText(userId)) : User.User;

            try {
                let result = await userCanister.upgradePersonalWorkspace(wasm_module);
                return result;
            } catch (err) {
                Debug.print("Error upgrading user personal workspace canister: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
            };
        };

        #ok;
    };

    public shared ({ caller }) func walletReceive() : async Result.Result<{ accepted : Nat64 }, { #unauthorized }> {
        if (caller != Principal.fromActor(CyclesDispenser)) {
            return #err(#unauthorized);
        };

        let amount = Cycles.available();
        let limit : Nat = stable_capacity - stable_balance;
        let accepted = if (amount <= limit) amount else limit;

        let deposit = Cycles.accept(accepted);

        assert (deposit == accepted);
        stable_balance += accepted;

        return #ok({ accepted = Nat64.fromNat(accepted) });
    };

    func isRegisteredUser(principal : Principal) : Bool {
        return state.data.getUserIdByOwner(principal) != null;
    };

    public shared ({ caller }) func requestCycles(amount : Nat) : async Result.Result<{ accepted : Nat64 }, { #unauthorized; #userNotFound }> {
        if (isRegisteredUser(caller) == false) {
            return #err(#unauthorized);
        };

        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_TOP_UP_INTERVAL;
        let currentBalance = Cycles.balance();
        let now = Time.now();
        let userId = switch (state.data.getUserIdByOwner(caller)) {
            case (?userId) { userId };
            case (null) {
                return #err(#userNotFound);
            };
        };
        let user = state.data.getUserByUserId(userId);
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

            switch (result) {
                case (#ok({ accepted })) {
                    return #ok({ accepted = accepted });
                };
                case (#err(err)) {
                    return #err(err);
                };
            };
        };
    };

    private func initializeTopUpsForCanister(canisterId : Principal) : () {
        let topUp : CanisterTopUp.CanisterTopUp = {
            var topUpInProgress = false;
            var latestTopUp = null;
        };
        topUps.put(canisterId, topUp);
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
        stable_username_to_user_id := state.data.username_to_user_id.share();
        stable_topUps := topUps.share();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        stable_user_identity_to_canister_id := #leaf;
        stable_user_canister_id_to_identity := #leaf;
        stable_username_to_user_id := #leaf;
        stable_topUps := #leaf;

        doCanisterGeekPostUpgrade();
    };
};
