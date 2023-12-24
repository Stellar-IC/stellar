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
    stable let WORKSPACE__CAPACITY = Constants.WORKSPACE__CAPACITY;
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
    var timersHaveBeenStarted = false;

    public query ({ caller }) func profile() : async Result.Result<UserProfile.UserProfile, { #unauthorized }> {
        if (caller != stable_owner) {
            return #err(#unauthorized);
        };

        return #ok(UserProfile.fromMutableUserProfile(stable_profile));
    };

    public shared ({ caller }) func personalWorkspace() : async Result.Result<WorkspacesTypes.WorkspaceId, { #anonymousUser; #insufficientCycles; #unauthorized }> {
        if (caller != stable_owner) {
            return #err(#unauthorized);
        };

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

    public shared ({ caller }) func updateProfile(
        input : UsersTypes.ProfileInput
    ) : async Result.Result<UserProfile.UserProfile, { #unauthorized }> {
        if (caller != stable_owner) {
            return #err(#unauthorized);
        };

        stable_profile.username := input.username;
        stable_profile.updatedAt := Time.now();

        return #ok(UserProfile.fromMutableUserProfile(stable_profile));
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

    public shared ({ caller }) func upgradePersonalWorkspace() {
        let workspaceActor = switch (stable_personalWorkspace) {
            case (null) { Debug.trap("Personal workspace not initialized") };
            case (?workspace) { workspace };
        };

        let workspace = await (system Workspace.Workspace)(
            #upgrade(workspaceActor)
        )(await (workspaceActor.getInitArgs()), await (workspaceActor.getInitData()));
    };

    public shared func updatePersonalWorkspaceCanisterSettings(updatedSettings : CoreTypes.CanisterSettings) : async () {
        let IC0 : CoreTypes.Management = actor "aaaaa-aa";

        let workspaceId = switch (stable_personalWorkspaceId) {
            case (null) { Debug.trap("Personal workspace not initialized") };
            case (?workspaceId) { workspaceId };
        };
        let canister_status = await IC0.canister_status({
            canister_id = workspaceId;
        });
        let memoryAllocation = switch (updatedSettings.memory_allocation) {
            case (null) { canister_status.settings.memory_allocation };
            case (?memoryAllocation) { memoryAllocation };
        };
        let computeAllocation = switch (updatedSettings.compute_allocation) {
            case (null) { canister_status.settings.compute_allocation };
            case (?computeAllocation) { computeAllocation };
        };
        let freezingThreshold = switch (updatedSettings.freezing_threshold) {
            case (null) { canister_status.settings.freezing_threshold };
            case (?freezingThreshold) { freezingThreshold };
        };

        let sender_canister_version : ?Nat64 = null;

        try {
            IC0.update_settings(
                {
                    canister_id = workspaceId;
                    settings = {
                        controllers = ?canister_status.settings.controllers;
                        compute_allocation = ?computeAllocation;
                        memory_allocation = ?memoryAllocation;
                        freezing_threshold = ?freezingThreshold;
                    };
                    sender_canister_version = sender_canister_version;
                }
            );
        } catch (err) {
            Debug.print("Error updating user canister settings: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
        };
    };

    public shared func upgradePersonalWorkspaceCanisterWasm(wasm_module : Blob) : async () {
        let IC0 : CoreTypes.Management = actor "aaaaa-aa";

        let sender_canister_version : ?Nat64 = null;

        let workspaceId = switch (stable_personalWorkspaceId) {
            case (null) { Debug.trap("Personal workspace not initialized") };
            case (?workspaceId) { workspaceId };
        };
        let workspaceActor = switch (stable_personalWorkspace) {
            case (null) { Debug.trap("Personal workspace not initialized") };
            case (?workspace) { workspace };
        };

        try {
            await IC0.install_code(
                {
                    arg = to_candid (
                        await (workspaceActor.getInitArgs()),
                        await (workspaceActor.getInitData()),
                    );
                    canister_id = workspaceId;
                    mode = #upgrade(
                        ?{
                            skip_pre_upgrade = ?false;
                        }
                    );
                    sender_canister_version = sender_canister_version;
                    wasm_module = wasm_module;
                }
            );
        } catch (err) {
            Debug.print("Error upgrading personal workspace canister: " # debug_show (Error.code(err)) # ": " # debug_show (Error.message(err)));
        };
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
        if (timersHaveBeenStarted) {
            return;
        };
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
        startRecurringTimers();
    };
};
