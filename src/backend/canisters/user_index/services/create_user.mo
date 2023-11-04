import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

import Constants "../../../constants";

import User "../../user/main";

import State "../model/state";

module CreateUser {
    let intialUserCycles = Constants.USER__INITIAL_CYCLES_BALANCE;
    let userCapacity = Constants.USER__CAPACITY;

    public func execute(
        state : State.State,
        owner : Principal,
        userIndexPrincipal : Principal,
    ) : async Result.Result<{ #created : (Principal, User.User); #existing : (Principal, User.User) }, { #anonymousUser; #insufficientCycles; #missingUserCanister }> {
        var balance = Cycles.balance();

        if (balance < intialUserCycles) {
            return #err(#insufficientCycles);
        };

        if (Principal.isAnonymous(owner)) {
            return #err(#anonymousUser);
        };

        switch (state.data.getUserIdByPrincipal(owner)) {
            case null {};
            case (?userId) {
                let user = state.data.getUserByUserId(userId);

                switch (user) {
                    case null {
                        return #err(#missingUserCanister);
                    };
                    case (?user) {
                        return #ok(#existing(userId, user));
                    };
                };
            };
        };

        let userInitArgs = {
            capacity = userCapacity;
            owner = owner;
        };

        Cycles.add(intialUserCycles);

        let user = await (system User.User)(
            #new {
                settings = ?{
                    controllers = ?[owner, userIndexPrincipal];
                    compute_allocation = ?Constants.USER__COMPUTE_ALLOCATION;
                    memory_allocation = ?Constants.USER__MEMORY_ALLOCATION;
                    freezing_threshold = ?Constants.USER__FREEZING_THRESHOLD;
                };
            }
        )(userInitArgs);

        let userPrincipal = Principal.fromActor(user);

        await state.data.addUser({
            user = user;
            user_id = userPrincipal;
            principal = owner;
        });

        #ok(#created(userPrincipal, user));
    };
};
