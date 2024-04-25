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
import Text "mo:base/Text";
import Array "mo:base/Array";
import Canistergeek "mo:canistergeek/canistergeek";
import Source "mo:uuid/async/SourceV4";
import Map "mo:map/Map";

import Constants "../../constants";
import Block "../../lib/blocks/Block";
import BlockBuilder "../../lib/blocks/BlockBuilder";
import CanisterTopUp "../../lib/shared/CanisterTopUp";
import UserProfile "../../lib/users/UserProfile";
import UsersTypes "../../lib/users/types";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import CoreTypes "../../types";
import AuthUtils "../../utils/auth";
import Tree "../../utils/data/lseq/Tree";

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

    func userEventNameToHash(event : Types.UserEventName) : Nat32 {
        switch (event) {
            case (#profileUpdated) { 0 };
        };
    };

    func userEventNameCompare(eventA : Types.UserEventName, eventB : Types.UserEventName) : Bool {
        return eventA == eventB;
    };

    let userEventNameHash = (userEventNameToHash, userEventNameCompare);

    stable var canisterSubscriptions = Map.new<Types.UserEventName, Map.Map<Principal, Types.ProfileUpdatedSubscription>>();

    public shared ({ caller }) func subscribe(
        event : Types.UserEventName,
        eventHandler : Types.UserEventSubscription,
    ) : async () {
        let subscriptionsForEvent = Map.get(canisterSubscriptions, userEventNameHash, event);

        switch (subscriptionsForEvent) {
            case (null) {
                // No subscriptions for this event yet, create a new map
                let subscriptions = Map.new<Principal, Types.ProfileUpdatedSubscription>();
                ignore Map.put(subscriptions, Map.phash, caller, eventHandler);
                ignore Map.put(canisterSubscriptions, userEventNameHash, event, subscriptions);
            };
            case (?subscriptions) {
                ignore Map.put<Principal, Types.ProfileUpdatedSubscription>(subscriptions, Map.phash, caller, eventHandler);
            };
        };
    };

    /* public shared ({ caller }) func unsubscribe() : async () {} */

    func publishEvent(event : Types.UserEvent) : async () {
        let subscribers = switch (event.event) {
            case (#profileUpdated({ profile })) {
                Map.get(canisterSubscriptions, userEventNameHash, #profileUpdated);
            };
        };

        switch (subscribers) {
            case (null) {};
            case (?subscribers) {
                let subscriptions = Map.entries(subscribers);
                for (subscription in subscriptions) {
                    let handler = subscription.1;
                    ignore handler(event);
                };
            };
        };
    };

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
                    owner = Principal.fromActor(self);
                    controllers = [stable_owner, Principal.fromActor(self)];
                    initialUsers = [(
                        stable_owner,
                        {
                            identity = stable_owner;
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

        // var pageBuilder = BlockBuilder.BlockBuilder({
        //     uuid = await Source.Source().new();
        // }).setTitle("Getting Started");

        // var i = 0;

        // let pageToCreate = Block.toShareable(pageBuilder.build());

        // let result = await workspace.createPage({
        //     pageToCreate with initialBlockUuid = null;
        // });

        #ok(workspaceId);
    };

    public shared ({ caller }) func updateProfile(input : UsersTypes.ProfileInput) : async Result.Result<UserProfile.UserProfile, { #unauthorized; #usernameTaken }> {
        if (caller != stable_owner) { return #err(#unauthorized) };

        switch (await checkUsernameAvailability(input.username)) {
            case (#err(error)) { return #err(error) };
            case (#ok(())) {
                stable_profile.username := input.username;
            };
        };

        stable_profile.updatedAt := Time.now();

        let immutableProfile = UserProfile.fromMutableUserProfile(stable_profile);

        ignore publishEvent({
            userId = Principal.fromActor(self);
            event = #profileUpdated({ profile = immutableProfile });
        });

        return #ok(immutableProfile);
    };

    func checkUsernameAvailability(username : Text) : async Result.Result<(), { #usernameTaken }> {
        let userIndexCanister = actor (Principal.toText(userIndexCanisterId)) : actor {
            checkUsername : (username : Text) -> async Result.Result<(), { #usernameTaken }>;
        };
        await userIndexCanister.checkUsername(username);
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
        let workspace = switch (stable_personalWorkspace) {
            case (null) {
                return #err(#workspaceNotFound("Personal workspace not initialized for user: " # debug_show (Principal.fromActor(self))));
            };
            case (?workspace) { workspace };
        };
        let initArgs = switch (await workspace.getInitArgs()) {
            case (#ok(args)) { args };
            case (#err(err)) {
                return #err(#failed("Failed to get init args for personal workspace: " # debug_show (err)));
            };
        };
        let initData = switch (await workspace.getInitData()) {
            case (#ok(data)) { data };
            case (#err(err)) {
                return #err(#failed("Failed to get init data for personal workspace: " # debug_show (err)));
            };
        };

        try {
            await IC0.install_code(
                {
                    arg = to_candid (
                        initArgs,
                        initData,
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
