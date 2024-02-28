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
    public func execute(
        state : State.State,
        owner : Principal,
        userIndexPrincipal : Principal,
    ) : async Result.Result<{ #created : (Principal, User.User); #existing : (Principal, User.User) }, { #anonymousUser; #insufficientCycles; #canisterNotFoundForRegisteredUser }> {
        let CONSTANTS = Constants.Constants();
        let USER__CAPACITY = CONSTANTS.USER__CAPACITY.scalar;
        let USER__FREEZING_THRESHOLD = CONSTANTS.USER__FREEZING_THRESHOLD.scalar;
        let USER__INITIAL_CYCLES_BALANCE = CONSTANTS.USER__INITIAL_CYCLES_BALANCE.scalar;

        var balance = Cycles.balance();

        if (balance < USER__INITIAL_CYCLES_BALANCE) {
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
                        return #err(#canisterNotFoundForRegisteredUser);
                    };
                    case (?user) {
                        return #ok(#existing(userId, user));
                    };
                };
            };
        };

        let userInitArgs = {
            owner = owner;
            capacity = USER__CAPACITY;
        };

        Cycles.add(USER__INITIAL_CYCLES_BALANCE);

        let user = await (system User.User)(
            #new {
                settings = ?{
                    controllers = ?[owner, userIndexPrincipal];
                    compute_allocation = null;
                    memory_allocation = null;
                    freezing_threshold = ?USER__FREEZING_THRESHOLD;
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
