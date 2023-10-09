import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

import User "../../user/main";

import State "../model/state";

module {
    let CYCLES_REQUIRED_FOR_UPGRADE = 80_000_000_000; // 0.08T cycles
    let USER_CANISTER_TOP_UP_AMOUNT = 100_000_000_000; // 0.1T cycles

    public func createUser(
        state : State.State,
        user_principal : Principal,
        user_index_principal : Principal,
    ) : async Result.Result<{ #created : (Principal, User.User); #existing : (Principal, User.User) }, { #anonymousUser; #insufficientCycles; #missingUserCanister }> {
        let USER_CANISTER_INITIAL_CYCLES_BALANCE = CYCLES_REQUIRED_FOR_UPGRADE + USER_CANISTER_TOP_UP_AMOUNT; // 0.18T cycles
        let balance = Cycles.balance();

        if (balance < USER_CANISTER_INITIAL_CYCLES_BALANCE) {
            return #err(#insufficientCycles);
        };

        if (Principal.isAnonymous(user_principal)) {
            return #err(#anonymousUser);
        };

        switch (state.data.getUserIdByPrincipal(user_principal)) {
            case null {};
            case (?userId) {
                let user_canister = state.data.getUserByUserId(userId);

                switch (user_canister) {
                    case null {
                        return #err(#missingUserCanister);
                    };
                    case (?user_canister) {
                        return #ok(#existing(userId, user_canister));
                    };
                };
            };
        };

        Cycles.add(USER_CANISTER_INITIAL_CYCLES_BALANCE);

        let user_canister_init_settings = ?{
            controllers = ?[user_principal, user_index_principal];
            compute_allocation = ?5;
            memory_allocation = ?5_000_000; // minimum amount needed is 2_360_338
            freezing_threshold = ?1_000;
        };
        let user_canister_init_args = {
            capacity = 100_000_000_000_000;
            principal = user_principal;
        };
        let user_canister = await (system User.User)(
            #new { settings = user_canister_init_settings }
        )(user_canister_init_args);
        let user_canister_principal = Principal.fromActor(user_canister);

        await state.data.addUser({
            user = user_canister;
            user_id = user_canister_principal;
            principal = user_principal;
        });

        #ok(#created(user_canister_principal, user_canister));
    };
};
