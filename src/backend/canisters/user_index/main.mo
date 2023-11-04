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

import Constants "../../constants";
import CanisterTopUp "../../lib/shared/CanisterTopUp";
import EventStream "../../utils/EventStream";

import User "../user/main";

import State "./model/state";
import CreateUser "./services/create_user";
import Types "./types";

actor UserIndex {
    type UserId = Principal;
    stable let MIN_BALANCE = Constants.USER_INDEX__MIN_BALANCE;
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
            case (#err(#missingUserCanister)) {
                return #err(#missingUserCanister);
            };
            case (#ok(#existing(principal, user))) {
                return #ok(principal);
            };
            case (#ok(#created(principal, user))) {
                Debug.print("User created with principal: " # debug_show (principal));
                ignore initializeTopUpsForCanister(principal);
                return #ok(principal);
            };
        };
    };

    public shared func upgradeUserCanisters() {
        for (entry in state.data.user_id_to_user_canister.entries()) {
            var userId = entry.0;
            var user = await (system User.User)(
                #upgrade(entry.1)
            )({
                capacity = USER_CAPACITY;
                owner = userId;
            });
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
        Debug.print("Cycles requested for user - " # debug_show (caller));

        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_TOP_UP_INTERVAL;
        let minBalance = MIN_BALANCE;
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

        Debug.print("should throttle: " # debug_show (shouldThrottle));

        if (topUp.topUpInProgress) {
            Debug.trap("Top up in progress");
        } else if (amount > maxAmount) {
            Debug.trap("Amount too high");
        } else if (shouldThrottle) {
            Debug.trap("Throttled");
        } else if (currentBalance < minBalance + amount) {
            Debug.trap("Balance too low");
        } else {
            CanisterTopUp.setTopUpInProgress(topUp, true);
            ExperimentalCycles.add(amount);
            let result = await user.walletReceive();
            CanisterTopUp.setTopUpInProgress(topUp, false);
            Debug.print(debug_show (result.accepted) # "cycles deposited for user - " # debug_show (caller));
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
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        stable_username_to_user_id := state.data.username_to_user_id.share();
        stable_principal_to_user_id := state.data.principal_to_user_id.share();
        stable_user_id_to_principal := state.data.user_id_to_principal.share();
        stable_user_id_to_user_canister := state.data.user_id_to_user_canister.share();
        stable_topUps := topUps.share();
    };

    system func postupgrade() {
        stable_username_to_user_id := #leaf;
        stable_principal_to_user_id := #leaf;
        stable_user_id_to_principal := #leaf;
        stable_user_id_to_user_canister := #leaf;
        stable_topUps := #leaf;
    };
};
