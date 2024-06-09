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
    type Input = {
        controllers : ?[Principal];
        owner : Principal;
    };
    type Output = Result.Result<Principal, { #AnonymousOwner; #InsufficientCycles }>;

    public func execute(input : Input) : async Output {
        let USER__CAPACITY = Constants.USER__CAPACITY.scalar;
        let USER__FREEZING_THRESHOLD = Constants.USER__FREEZING_THRESHOLD.scalar;
        let USER__INITIAL_CYCLES_BALANCE = Constants.USER__INITIAL_CYCLES_BALANCE.scalar;

        let { controllers; owner } = input;

        if (Principal.isAnonymous(owner)) {
            return #err(#AnonymousOwner);
        };

        if (Cycles.balance() < USER__INITIAL_CYCLES_BALANCE) {
            return #err(#InsufficientCycles);
        };

        Cycles.add(USER__INITIAL_CYCLES_BALANCE);

        let userInitArgs = { owner; capacity = USER__CAPACITY };
        let user = await (system User.User)(
            #new {
                settings = ?{
                    controllers = controllers;
                    compute_allocation = null;
                    memory_allocation = null;
                    freezing_threshold = ?USER__FREEZING_THRESHOLD;
                };
            }
        )(userInitArgs);

        let userId = Principal.fromActor(user);

        #ok(userId);
    };
};
