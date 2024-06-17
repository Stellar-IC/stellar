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
import Array "mo:base/Array";
import Canistergeek "mo:canistergeek/canistergeek";
import Map "mo:map/Map";

import Constants "../../constants";
import AuthUtils "../../utils/auth";
import CanisterTopUp "../../lib/canister_top_up";
import UserRegistryV2 "../../lib/user_registry_v2";
import UserRegistryV3 "../../lib/user_registry_v3";
import CoreTypes "../../types";
import User "../user/main";
import UserTypes "../user/types";

import CreateUser "./services/create_user";
import State "./state";
import Types "./types";

actor UserIndex {
    type UserId = Principal;
    type UserDetails = { canisterId : Principal; username : Text };

    stable let USER_CAPACITY = Constants.USER__CAPACITY.scalar;
    stable let MAX_TOP_UP_AMOUNT = Constants.USER__TOP_UP_AMOUNT.scalar;
    stable let MIN_TOP_UP_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    stable var _userRegistry3 = UserRegistryV3.UserRegistry<UserDetails>();

    stable var stable_topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;
    stable let stable_capacity = 100_000_000_000_000;
    stable var stable_balance = 0 : Nat;

    stable var loginDisabled = true;

    // deprecated fields
    stable var _userRegistry = UserRegistryV2.UserRegistry<UserDetails>();
    stable var stable_user_identity_to_canister_id : RBTree.Tree<Principal, UserId> = #leaf;
    stable var stable_user_canister_id_to_identity : RBTree.Tree<UserId, Principal> = #leaf;
    stable var stable_username_to_user_id : RBTree.Tree<Text, UserId> = #leaf;

    var stable_data = {
        user_identity_to_canister_id = stable_user_identity_to_canister_id;
        user_canister_id_to_identity = stable_user_canister_id_to_identity;
        username_to_user_id = stable_username_to_user_id;
    };

    var state = State.State(State.Data(stable_data));

    // Migrate existing users from state to UserRegistryV2
    label _loop for (entry in state.data.username_to_user_id.entries()) {
        let username = entry.0;
        let userId = entry.1;
        let userIdentity = switch (state.data.user_canister_id_to_identity.get(userId)) {
            case (null) { continue _loop };
            case (?userIdentity) { userIdentity };
        };

        UserRegistryV2.addUser<UserDetails>(_userRegistry, userIdentity, userId, { canisterId = userId; username = username });
    };

    // Migrate from UserRegistryV2 to UserRegistryV3
    label _loop for (user in Array.vals(UserRegistryV2.getUsers<UserDetails>(_userRegistry))) {
        let userId = user.canisterId;
        let userIdentity = switch (Map.get(_userRegistry.userIdentityByUserId, Map.phash, userId)) {
            case (null) {
                continue _loop;
            };
            case (?userIdentity) { userIdentity };
        };

        UserRegistryV3.addUser<UserDetails>(_userRegistry3, userIdentity, userId, { canisterId = userId; username = user.username });
    };

    let topUps = RBTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    public shared ({ caller }) func registerUser() : async Types.RegisterUserResult {
        if (loginDisabled) {
            return #err(#LoginDisabled);
        };

        if (Principal.isAnonymous(caller)) {
            return #err(#AnonymousOwner);
        };

        // Check if the user already exists
        switch (state.data.getUserIdByOwner(caller)) {
            case null {};
            case (?userId) {
                let user = state.data.getUserByUserId(userId);
                return #ok(userId);
            };
        };

        // Create User canister
        let owner = caller;
        let controllers = ?[caller, Principal.fromActor(UserIndex)];
        let result = await CreateUser.execute({ owner; controllers });
        let userId = switch (result) {
            case (#err(err)) { return #err(err) };
            case (#ok(userId)) { userId };
        };
        let user = actor (Principal.toText(userId)) : User.User;

        UserRegistryV3.addUser(_userRegistry3, caller, userId, { canisterId = userId; username = "" });
        UserRegistryV2.addUser(_userRegistry, caller, userId, { canisterId = userId; username = "" });

        // TODO: Remove this once state is fully deprecated
        state.data.addUser({ user; userId; owner = caller });

        initializeTopUpsForCanister(userId);
        await user.subscribe(#profileUpdated, onUserEvent);

        return #ok(userId);
    };

    public shared ({ caller = canisterId }) func onUserEvent(event : UserTypes.UserEvent) : async () {
        if (UserRegistryV3.findUserByUserId<UserDetails>(_userRegistry3, canisterId) == null) {
            // caller is not a registered user
            return;
        };

        switch (event.event) {
            case (#profileUpdated(data)) {
                UserRegistryV3.updateUserByUserId<UserDetails>(_userRegistry3, canisterId, { canisterId; username = data.profile.username });

                // TODO: Remove this once state is fully deprecated
                state.data.username_to_user_id.put(data.profile.username, canisterId);
            };
        };
    };

    public query func checkUsername(username : Text) : async Types.CheckUsernameResult {
        switch (UserRegistryV3.findUserByUsername(_userRegistry3, username)) {
            case (null) { #ok };
            case (?_) { #err(#UsernameTaken) };
        };
    };

    public query func userId(userIdentity : Principal) : async Result.Result<Principal, { #userNotFound }> {
        switch (UserRegistryV3.findUserByIdentity(_userRegistry3, userIdentity)) {
            case (null) { #err(#userNotFound) };
            case (?{ canisterId }) { #ok(canisterId) };
        };
    };

    public query func userDetailsByIdentity(userIdentity : Principal) : async Types.Queries.UserDetailsByIdentityResult {
        switch (UserRegistryV3.findUserByIdentity(_userRegistry3, userIdentity)) {
            case (null) { #err(#userNotFound) };
            case (?details) { #ok(details) };
        };
    };

    public shared ({ caller }) func upgradeUser(userId : Principal, wasm_module : Blob) : async Result.Result<(), { #unauthorized }> {
        if ((AuthUtils.isDev(caller)) == false) {
            return #err(#unauthorized);
        };

        let IC0 : CoreTypes.Management = actor "aaaaa-aa";
        let sender_canister_version : ?Nat64 = null;

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

        #ok;
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

    public query func settings() : async { loginDisabled : Bool } {
        return { loginDisabled };
    };

    public shared ({ caller }) func enableLogin() : async Result.Result<(), { #unauthorized }> {
        if ((AuthUtils.isDev(caller)) == false) { return #err(#unauthorized) };
        loginDisabled := false;
        #ok;
    };

    public shared ({ caller }) func disableLogin() : async Result.Result<(), { #unauthorized }> {
        if ((AuthUtils.isDev(caller)) == false) { return #err(#unauthorized) };
        loginDisabled := true;
        #ok;
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
