import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import Canistergeek "mo:canistergeek/canistergeek";

import Constants "../../constants";
import CanisterTopUp "../../lib/shared/CanisterTopUp";
import UserProfile "../../lib/users/UserProfile";
import UsersTypes "../../lib/users/types";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import CoreTypes "../../types";
import AuthUtils "../../utils/auth";

import Workspace "../workspace/main";

import Guards "./guards";
import Types "./types";

shared ({ caller = initializer }) actor class User(
    initArgs : Types.UserInitArgs
) = self {
    type WorkspaceId = Principal;

    stable let CONSTANTS = Constants.Constants();
    stable let WORKSPACE__TOP_UP_AMOUNT = CONSTANTS.WORKSPACE__TOP_UP_AMOUNT.scalar;
    stable let WORKSPACE__CAPACITY = CONSTANTS.WORKSPACE__CAPACITY.scalar;
    stable let userIndexCanisterId = initializer;

    stable var stable_balance = 0;
    stable var stable_capacity = initArgs.capacity;
    stable var stable_owner = initArgs.owner;
    stable var stable_personalWorkspaceId : ?WorkspaceId = null;
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

    public query ({ caller }) func publicProfile() : async Result.Result<CoreTypes.User.PublicUserProfile, { #unauthorized }> {
        if (Principal.isAnonymous(caller)) {
            return #err(#unauthorized);
        };

        #ok({
            canisterId = Principal.fromActor(self);
            username = stable_profile.username;
        });
    };

    public shared ({ caller }) func personalWorkspace() : async Result.Result<WorkspaceId, { #anonymousUser; #insufficientCycles; #unauthorized }> {
        if (caller != stable_owner) {
            return #err(#unauthorized);
        };

        let workspace = switch (stable_personalWorkspaceId) {
            case (?workspaceId) { return #ok(workspaceId) };
            case (null) {
                let result = await CreateWorkspace.execute({
                    owner = stable_owner;
                    controllers = [stable_owner, Principal.fromActor(self)];
                    initialUsers = [(
                        Principal.fromActor(self),
                        {
                            canisterId = Principal.fromActor(self);
                            username = stable_profile.username;
                            role = #admin;
                        },
                    )];
                });

                switch (result) {
                    case (#err(error)) { return #err(error) };
                    case (#ok(workspace)) { workspace };
                };
            };
        };
        let workspaceId = Principal.fromActor(workspace);

        stable_personalWorkspaceId := ?workspaceId;
        stable_personalWorkspace := ?workspace;

        #ok(workspaceId);
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
    public shared ({ caller }) func walletReceive() : async Result.Result<{ accepted : Nat64 }, { #unauthorized }> {
        if (caller != initializer) {
            return #err(#unauthorized);
        };

        let amount = Cycles.available();
        let limit : Nat = stable_capacity - stable_balance;
        let accepted = if (amount <= limit) amount else limit;
        let deposit = Cycles.accept(accepted);

        assert (deposit == accepted);
        stable_balance += accepted;

        return #ok({ accepted = Nat64.fromNat(accepted) });
    };

    public shared ({ caller }) func upgradePersonalWorkspace(wasm_module : Blob) : async Result.Result<(), { #unauthorized; #workspaceNotFound : Text; #failed : Text }> {
        if (caller != initializer and AuthUtils.isDev(caller) == false) {
            return #err(#unauthorized);
        };

        let IC0 : CoreTypes.Management = actor "aaaaa-aa";
        let sender_canister_version : ?Nat64 = null;

        let workspaceId = switch (stable_personalWorkspaceId) {
            case (null) {
                return #err(#workspaceNotFound("Personal workspace not initialized for user: " # debug_show (Principal.fromActor(self))));
            };
            case (?workspaceId) { workspaceId };
        };
        let workspaceActor = switch (stable_personalWorkspace) {
            case (null) {
                return #err(#workspaceNotFound("Personal workspace not initialized for user: " # debug_show (Principal.fromActor(self))));
            };
            case (?workspace) { workspace };
        };

        try {
            await IC0.install_code(
                {
                    arg = to_candid (
                        await workspaceActor.getInitArgs(),
                        await workspaceActor.getInitData(),
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
            return #err(#failed(Error.message(err)));
        };

        return #ok(());
    };

    private func checkCyclesBalance() : async () {
        let amount : Nat = stable_capacity - Cycles.balance();
        let userIndexCanister = actor (Principal.toText(userIndexCanisterId)) : actor {
            requestCycles : (amount : Nat) -> async {
                accepted : Nat64;
            };
        };
        let result = await userIndexCanister.requestCycles(amount);
        let accepted = result.accepted;
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
                personalWorkspaceTopUp.topUpInProgress := true;
                let amount = WORKSPACE__TOP_UP_AMOUNT;
                ExperimentalCycles.add(amount);
                let result = await workspace.walletReceive();
                personalWorkspaceTopUp.topUpInProgress := false;
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
            #seconds(60),
            checkCyclesBalance,
        );
        ignore Timer.recurringTimer(
            #seconds(60),
            topUpKnownCanisters,
        );
        timersHaveBeenStarted := true;
    };

    /*************************************************************************
     * Canister Monitoring
     *************************************************************************/

    // CanisterGeek
    private let canistergeekMonitor = Canistergeek.Monitor();
    private let canistergeekLogger = Canistergeek.Logger();
    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var _canistergeekLoggerUD : ?Canistergeek.LoggerUpgradeData = null;

    /**
    * Returns canister information based on passed parameters.
    * Called from browser.
    */
    public query ({ caller }) func getCanistergeekInformation(request : Canistergeek.GetInformationRequest) : async Canistergeek.GetInformationResponse {
        validateCaller(caller);
        Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request);
    };

    /**
    * Updates canister information based on passed parameters at current time.
    * Called from browser or any canister "update" method.
    */
    public shared ({ caller }) func updateCanistergeekInformation(request : Canistergeek.UpdateInformationRequest) : async () {
        validateCaller(caller);
        canistergeekMonitor.updateInformation(request);
    };

    private func validateCaller(principal : Principal) : () {
        //limit access here!
    };

    private func doCanisterGeekPreUpgrade() {
        _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
        _canistergeekLoggerUD := ?canistergeekLogger.preupgrade();
    };

    private func doCanisterGeekPostUpgrade() {
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        _canistergeekMonitorUD := null;

        canistergeekLogger.postupgrade(_canistergeekLoggerUD);
        _canistergeekLoggerUD := null;

        //Optional: override default number of log messages to your value
        canistergeekLogger.setMaxMessagesCount(3000);
    };

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        doCanisterGeekPostUpgrade();
        timersHaveBeenStarted := false;
        // Restart timers
        startRecurringTimers();

    };
};
