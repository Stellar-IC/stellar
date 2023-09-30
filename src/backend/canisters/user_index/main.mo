import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";

import State "./model/state";
import CreateUser "./services/create_user";
import Types "./types";

actor UserIndex {
    type UserId = Principal;

    stable var stable_username_to_user_id : RBTree.Tree<Text, UserId> = #leaf;
    stable var stable_principal_to_user_id : RBTree.Tree<Principal, UserId> = #leaf;
    stable var stable_user_id_to_principal : RBTree.Tree<UserId, Principal> = #leaf;

    var stable_data = {
        username_to_user_id = stable_username_to_user_id;
        principal_to_user_id = stable_principal_to_user_id;
        user_id_to_principal = stable_user_id_to_principal;
    };

    var state = State.State(State.Data(stable_data));

    public query func users() : async Result.Result<[Principal], ()> {
        return #ok(state.data.getUsers());
    };

    public shared ({ caller }) func registerUser() : async Types.RegisterUserResult {
        if (Principal.isAnonymous(caller)) {
            Debug.print("Anonymous caller not allowed");
            return #err(#anonymousUser);
        };

        let user_index_principal = Principal.fromActor(UserIndex);
        let existing_user_id = state.data.getUserIdByPrincipal(caller);

        switch (existing_user_id) {
            case (?value) {
                Debug.print("User already registered");
                return #ok(value);
            };
            case (null) {
                Debug.print("User not found. Creating user...");
                let principal = await CreateUser.createUser(state, caller, user_index_principal);

                switch (principal) {
                    case (#ok(value)) {
                        Debug.print("User successfully created");
                        return #ok(value);
                    };
                    case (#err(#anonymousUser)) {
                        #err(#anonymousUser);
                    };
                    case (#err(#insufficientCycles)) {
                        #err(#insufficientCycles);
                    };
                };
            };
        };
    };

    public shared (msg) func walletBalance() : async Nat {
        let balance = Cycles.balance();
        return balance;
    };

    system func preupgrade() {
        stable_username_to_user_id := state.data.username_to_user_id.share();
        stable_principal_to_user_id := state.data.principal_to_user_id.share();
        stable_user_id_to_principal := state.data.user_id_to_principal.share();
    };

    system func postupgrade() {
        stable_username_to_user_id := #leaf;
        stable_principal_to_user_id := #leaf;
        stable_user_id_to_principal := #leaf;
    };
};
