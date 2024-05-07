import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

import Constants "../../../constants";

import User "../../user/main";

import State "../state";
import Types "../types";

module CreateUser {
    public func execute(
        state : State.State,
        owner : Principal,
        userIndexPrincipal : Principal,
    ) : async Result.Result<{ #created : (Principal, User.User); #existing : (Principal, User.User) }, { #anonymousUser; #insufficientCycles; #canisterNotFoundForRegisteredUser }> {
        let USER__CAPACITY = Constants.USER__CAPACITY.scalar;
        let USER__FREEZING_THRESHOLD = Constants.USER__FREEZING_THRESHOLD.scalar;
        let USER__INITIAL_CYCLES_BALANCE = Constants.USER__INITIAL_CYCLES_BALANCE.scalar;

        let balance = Cycles.balance();

        if (Principal.isAnonymous(owner)) {
            return #err(#anonymousUser);
        };

        // Check if the user already exists
        switch (state.data.getUserIdByOwner(owner)) {
            case null {};
            case (?userId) {
                let user = state.data.getUserByUserId(userId);
                return #ok(#existing(userId, user));
            };
        };

        if (balance < USER__INITIAL_CYCLES_BALANCE) {
            return #err(#insufficientCycles);
        };

        Cycles.add(USER__INITIAL_CYCLES_BALANCE);

        let userInitArgs = { owner; capacity = USER__CAPACITY };
        let user = await (system User.User)(
            #new {
                settings = ?{
                    controllers = ?[userIndexPrincipal];
                    compute_allocation = null;
                    memory_allocation = null;
                    freezing_threshold = ?USER__FREEZING_THRESHOLD;
                };
            }
        )(userInitArgs);

        let userId = Principal.fromActor(user);

        await state.data.addUser({ user; userId; owner });

        #ok(#created(userId, user));
    };
};
