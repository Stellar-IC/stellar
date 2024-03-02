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
import Types "../types";

module CreateUser {
    public func execute(
        state : State.State,
        owner : Principal,
        userIndexPrincipal : Principal,
    ) : async Result.Result<{ #created : (Principal, Types.UserActor); #existing : (Principal, Types.UserActor) }, { #anonymousUser; #insufficientCycles; #canisterNotFoundForRegisteredUser }> {
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

        switch (state.data.getUserIdByOwner(owner)) {
            case null {};
            case (?userId) {
                let user = state.data.getUserByUserId(userId);
                return #ok(#existing(userId, user));
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
            owner = owner;
        });

        #ok(#created(userPrincipal, user));
    };
};
