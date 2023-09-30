import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Time "mo:base/Time";

import Types "../../types"

actor class User(
    initArgs : {
        capacity : Nat;
        principal : Principal;
    }
) {
    type Username = Text;

    module UserProfile {
        public type UserProfile = {
            username : ?Username;
            created_at : Time.Time;
            updated_at : Time.Time;
        };

        public type MutableUserProfile = {
            var username : ?Username;
            var created_at : Time.Time;
            var updated_at : Time.Time;
        };

        public func fromMutableUserProfile(profile : MutableUserProfile) : UserProfile {
            return {
                username = profile.username;
                created_at = profile.created_at;
                updated_at = profile.updated_at;
            };
        };
    };

    module DeliveryAgentAccount {
        type Suspension = {
            created_at : Time.Time;
            ends_at : Time.Time;
        };

        public class DeliveryAgentAccount(_user_id : Types.UserId) {
            let user_id : Types.UserId = _user_id;
            let suspensions : List.List<Suspension> = List.nil<Suspension>();
        };
    };

    type ProfileInput = {
        username : Username;
    };

    var balance = 0;
    var capacity = initArgs.capacity;
    var principal = initArgs.principal;
    var created_at = Time.now();
    var delivery_account : ?DeliveryAgentAccount.DeliveryAgentAccount = null;

    var _profile : UserProfile.MutableUserProfile = {
        var username = null;
        var created_at = Time.now();
        var updated_at = Time.now();
    };

    public query ({ caller }) func profile() : async Result.Result<UserProfile.UserProfile, { #notAuthorized }> {
        if (caller != principal) {
            return #err(#notAuthorized);
        };

        return #ok(UserProfile.fromMutableUserProfile(_profile));
    };

    public shared ({ caller }) func updateProfile(profile_input : ProfileInput) : async Result.Result<UserProfile.UserProfile, { #notAuthorized }> {
        if (caller != principal) {
            return #err(#notAuthorized);
        };

        _profile.username := ?profile_input.username;
        _profile.updated_at := Time.now();

        return #ok(UserProfile.fromMutableUserProfile(_profile));
    };

    public shared ({ caller }) func createDeliveryAgentAccount(profile_input : ProfileInput) : async Result.Result<DeliveryAgentAccount.DeliveryAgentAccount, { #alreadyExists; #notAuthorized; #unknownError }> {
        if (caller != principal) {
            return #err(#notAuthorized);
        };

        if (delivery_account != null) {
            return #err(#alreadyExists);
        };

        delivery_account := ?DeliveryAgentAccount.DeliveryAgentAccount(principal);

        switch (delivery_account) {
            case (null) { return #err(#unknownError) };
            case (?val) { return #ok(val) };
        };
    };

    // Returns the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted : Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - balance;
        let accepted = if (amount <= limit) amount else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        { accepted = Nat64.fromNat(accepted) };
    };

    // Return the current cycle balance
    public func wallet_balance() : async Nat {
        return balance;
    };
};
