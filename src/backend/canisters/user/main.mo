import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";

import CoreTypes "../../types";
import UserProfile "../../lib/users/UserProfile";
import UsersTypes "../../lib/users/types";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import WorkspacesTypes "../../lib/workspaces/types";

import Workspace "../workspace/main";
import Constants "../../constants";
import CanisterTopUp "../../lib/shared/CanisterTopUp";

import Types "./types";
import Guards "./guards";

shared ({ caller = initializer }) actor class User(
    initArgs : Types.UserInitArgs
) = self {
    stable let USER_MIN_BALANCE = Constants.USER__MIN_BALANCE;
    stable let userIndexCanisterId = initializer;

    stable var stable_balance = 0;
    stable var stable_capacity = initArgs.capacity;
    stable var stable_owner = initArgs.owner;
    stable var stable_personalWorkspaceId : ?WorkspacesTypes.WorkspaceId = null;
    stable var stable_personalWorkspace : ?Types.PersonalWorkspace = null;
    stable var stable_profile : UserProfile.MutableUserProfile = {
        var username = "";
        var created_at = Time.now();
        var updatedAt = Time.now();
    };

    public query ({ caller }) func profile() : async UserProfile.UserProfile {
        Guards.assertMatches(caller, stable_owner);

        return UserProfile.fromMutableUserProfile(stable_profile);
    };

    public shared ({ caller }) func personalWorkspace() : async Result.Result<WorkspacesTypes.WorkspaceId, { #anonymousUser; #insufficientCycles }> {
        Guards.assertMatches(caller, stable_owner);

        switch (stable_personalWorkspaceId) {
            case (null) {
                let result = await CreateWorkspace.execute({
                    owner = Principal.fromActor(self);
                });
                switch (result) {
                    case (#err(error)) { #err(error) };
                    case (#ok(workspace)) {
                        let workspaceId = Principal.fromActor(workspace);
                        stable_personalWorkspaceId := ?workspaceId;
                        stable_personalWorkspace := ?workspace;
                        #ok(workspaceId);
                    };
                };
            };
            case (?workspaceId) { #ok(workspaceId) };
        };
    };

    // public shared ({ caller }) func upgradePersonalWorkspace() {
    //     Guards.assertMatches(caller, stable_owner);

    //     let workspaceActor = switch (stable_personalWorkspace) {
    //         case (null) { Debug.trap("Personal workspace not initialized") };
    //         case (?workspace) { workspace };
    //     };

    //     let workspace = await (system Workspace.Workspace)(
    //         #upgrade(workspaceActor)
    //     )(await (workspaceActor.getInitArgs()), await (workspaceActor.getInitData()));
    // };

    public shared ({ caller }) func updateProfile(
        input : UsersTypes.ProfileInput
    ) : async UserProfile.UserProfile {
        Guards.assertIsNotAnonymous(caller);
        Guards.assertMatches(caller, stable_owner);

        stable_profile.username := input.username;
        stable_profile.updatedAt := Time.now();

        return UserProfile.fromMutableUserProfile(stable_profile);
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

    private func checkCyclesBalance() : async () {
        if (Cycles.balance() < USER_MIN_BALANCE) {
            let amount : Nat = stable_capacity - Cycles.balance();
            let userIndexCanister = actor (Principal.toText(userIndexCanisterId)) : actor {
                requestCycles : (amount : Nat) -> async {
                    accepted : Nat64;
                };
            };
            let result = await userIndexCanister.requestCycles(amount);
        };
    };

    let personalWorkspaceTopUp : CanisterTopUp.CanisterTopUp = {
        var topUpInProgress = false;
        var latestTopUp = null;
    };

    private func topUpKnownCanisters() : async () {
        if (personalWorkspaceTopUp.topUpInProgress) {
            return;
        };

        switch (stable_personalWorkspace) {
            case (null) {};
            case (?workspace) {
                let workspaceCyclesInfo = await (workspace.cyclesInformation());
                let workspaceCapacity = workspaceCyclesInfo.capacity;
                let workspaceBalance = workspaceCyclesInfo.balance;

                if (workspaceBalance < Constants.WORKSPACE__MIN_BALANCE) {
                    personalWorkspaceTopUp.topUpInProgress := true;
                    let amount = Constants.WORKSPACE__TOP_UP_AMOUNT;
                    ExperimentalCycles.add(amount);
                    let result = await workspace.walletReceive();
                    personalWorkspaceTopUp.topUpInProgress := false;
                };
            };
        };
    };

    /*************************************************************************
     * Timers
     *************************************************************************/
    private func startRecurringTimers() {
        Debug.print("Restarting timers");
        ignore Timer.recurringTimer(
            #seconds(60 * 5),
            checkCyclesBalance,
        );
        ignore Timer.recurringTimer(
            #seconds(60 * 5),
            topUpKnownCanisters,
        );
    };

    // Start timers on install
    startRecurringTimers();

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {};

    system func postupgrade() {
        // Restart timers
        // startRecurringTimers();
    };
};
