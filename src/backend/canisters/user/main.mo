import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Time "mo:base/Time";

import CoreTypes "../../types";
import UserProfile "../../lib/users/UserProfile";
import UsersTypes "../../lib/users/types";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import WorkspacesTypes "../../lib/workspaces/types";

import Workspace "../workspace/main";

shared ({ caller = initializer }) actor class User(
    initArgs : {
        capacity : Nat;
        owner : Principal;
    }
) {
    stable var stable_balance = 0;
    stable var stable_capacity = initArgs.capacity;
    stable var stable_owner = initArgs.owner;
    stable var stable_personalWorkspaceId : ?WorkspacesTypes.WorkspaceId = null;

    stable var stable_profile : UserProfile.MutableUserProfile = {
        var username = "";
        var created_at = Time.now();
        var updated_at = Time.now();
    };

    private func _assertIsNotAnonymous(principal : Principal) {
        if (Principal.isAnonymous(principal)) {
            Debug.trap("Anonymous access not allowed");
        };
    };

    private func _assertIsOwner(principal : Principal) {
        if (principal != stable_owner) {
            Debug.trap("Unauthorized access not allowed");
        };
    };

    public query ({ caller }) func profile() : async UserProfile.UserProfile {
        _assertIsNotAnonymous(caller);
        _assertIsOwner(caller);

        return UserProfile.fromMutableUserProfile(stable_profile);
    };

    public shared ({ caller }) func personalWorkspace() : async Result.Result<WorkspacesTypes.WorkspaceId, { #anonymousUser; #insufficientCycles }> {
        _assertIsNotAnonymous(caller);
        _assertIsOwner(caller);

        switch (stable_personalWorkspaceId) {
            case (null) {
                let result = await CreateWorkspace.execute({ owner = caller });
                switch (result) {
                    case (#err(error)) { #err(error) };
                    case (#ok(workspace)) {
                        let workspaceId = Principal.fromActor(workspace);
                        stable_personalWorkspaceId := ?workspaceId;
                        #ok(workspaceId);
                    };
                };
            };
            case (?workspaceId) { #ok(workspaceId) };
        };
    };

    public shared ({ caller }) func updateProfile(
        input : UsersTypes.ProfileInput
    ) : async UserProfile.UserProfile {
        _assertIsNotAnonymous(caller);
        _assertIsOwner(caller);

        stable_profile.username := input.username;
        stable_profile.updated_at := Time.now();

        return UserProfile.fromMutableUserProfile(stable_profile);
    };

    // Returns the cycles received up to the capacity allowed
    public func wallet_receive() : async { accepted : Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = stable_capacity - stable_balance;
        let accepted = if (amount <= limit) amount else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        stable_balance += accepted;

        return { accepted = Nat64.fromNat(accepted) };
    };

    // Return the current cycle balance
    public func wallet_balance() : async Nat {
        return stable_balance;
    };
};
