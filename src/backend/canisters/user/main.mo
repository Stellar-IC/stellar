import FileUpload "canister:file_upload";

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
import Iter "mo:base/Iter";
import Canistergeek "mo:canistergeek/canistergeek";
import Source "mo:uuid/async/SourceV4";
import Map "mo:map/Map";
import StableBuffer "mo:stablebuffer/StableBuffer";

import Constants "../../constants";
import Block "../../lib/blocks/block";
import BlockBuilder "../../lib/blocks/block_builder";
import UserProfile "../../lib/users/user_profile";
import UsersTypes "../../lib/users/types";
import CoreTypes "../../types";
import AuthUtils "../../utils/auth";
import Tree "../../utils/data/lseq/Tree";

import Types "./types";

shared ({ caller = initializer }) actor class User(
    initArgs : Types.UserInitArgs
) = self {
    type WorkspaceId = Principal;

    /* Principal of UserIndex canister */
    stable let userIndexCanisterId = initializer;

    /* Amount of cycles in this canister */
    stable var _balance = 0;

    /* Maximum number of cycles */
    stable var _capacity = initArgs.capacity;

    /* Identity of the user */
    stable var _owner = initArgs.owner;

    /* Principal of this user's default workspace canister */
    stable var _personalWorkspaceId : ?WorkspaceId = null;

    /* Default workspace canister */
    stable var _personalWorkspace : ?Types.PersonalWorkspace = null;

    /* List of workspaces that the user has access to */
    stable var _workspaces = StableBuffer.init<WorkspaceId>();

    /* User profile */
    stable var _profile : UserProfile.MutableUserProfile = {
        var username = "";
        var avatarUrl = null;
        var created_at = Time.now();
        var updatedAt = Time.now();
    };

    /*************************************************************************
     * User Events
     *************************************************************************/

    stable var canisterSubscriptions = Map.new<Types.UserEventName, Map.Map<Principal, Types.ProfileUpdatedSubscription>>();

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
        let subscriptions = getEventSubscriptions(event);

        for (subscription in Array.vals(subscriptions)) {
            let handler = subscription.1;
            ignore handler(event);
        };
    };

    /*************************************************************************
     * Queries
     *************************************************************************/

    public query ({ caller }) func profile() : async Result.Result<UserProfile.UserProfile, { #unauthorized }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        return #ok(UserProfile.fromMutableUserProfile(_profile));
    };

    public query ({ caller }) func publicProfile() : async Result.Result<CoreTypes.User.PublicUserProfile, { #unauthorized }> {
        if (Principal.isAnonymous(caller)) {
            return #err(#unauthorized);
        };

        #ok({
            canisterId = Principal.fromActor(self);
            username = _profile.username;
            avatarUrl = _profile.avatarUrl;
        });
    };

    public shared query ({ caller }) func personalWorkspace() : async Result.Result<?WorkspaceId, { #anonymousUser; #insufficientCycles; #unauthorized }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        return #ok(_personalWorkspaceId);
    };

    public shared ({ caller }) func workspaces() : async Result.Result<[WorkspaceId], { #unauthorized }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        return #ok(StableBuffer.toArray(_workspaces));
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    public shared ({ caller }) func setPersonalWorkspace(
        workspaceId : WorkspaceId
    ) : async Result.Result<(), { #unauthorized }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        _personalWorkspaceId := ?workspaceId;
        _personalWorkspace := ?(actor (Principal.toText(workspaceId)) : Types.PersonalWorkspace);

        _addWorkspace(_workspaces, workspaceId);

        #ok();
    };

    public shared ({ caller }) func addWorkspace(
        workspaceDetails : { canisterId : Principal }
    ) : async Result.Result<(), { #unauthorized }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        _addWorkspace(_workspaces, workspaceDetails.canisterId);

        return #ok;
    };

    public shared ({ caller }) func removeWorkspace(
        workspaceDetails : { canisterId : Principal }
    ) : async Result.Result<(), { #unauthorized; #removalPrevented }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        if (_personalWorkspaceId == ?workspaceDetails.canisterId) {
            return #err(#removalPrevented);
        };

        let workspaceId = workspaceDetails.canisterId;
        StableBuffer.filterEntries<Principal>(_workspaces, func(i, id) { id != workspaceId });

        return #ok;
    };

    public shared ({ caller }) func setAvatar(
        file : {
            name : Text;
            content : [Nat8];
            content_type : Text;
        }
    ) : async Result.Result<UserProfile.UserProfile, { #unauthorized; #fileUploadError : Text }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        let uploadData = {
            key = file.name;
            content = file.content;
            content_type = file.content_type;
        };
        let fileUrl = switch (await FileUpload.store(uploadData)) {
            case (#ok({ url })) { url };
            case (#err(error)) { return #err(#fileUploadError(error)) };
        };

        _profile.avatarUrl := ?fileUrl;

        return #ok(UserProfile.fromMutableUserProfile(_profile));
    };

    public shared ({ caller }) func updateProfile(input : UsersTypes.ProfileInput) : async Result.Result<UserProfile.UserProfile, { #unauthorized; #usernameTaken }> {
        if (caller != _owner) { return #err(#unauthorized) };

        switch (await checkUsernameAvailability(input.username)) {
            case (#err(error)) { return #err(error) };
            case (#ok(())) {
                _profile.username := input.username;
            };
        };

        _profile.updatedAt := Time.now();

        let immutableProfile = UserProfile.fromMutableUserProfile(_profile);

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
        let limit : Nat = _capacity - _balance;
        let accepted = if (amount <= limit) amount else limit;
        let deposit = Cycles.accept(accepted);

        assert (deposit == accepted);
        _balance += accepted;

        return #ok({ accepted = Nat64.fromNat(accepted) });
    };

    private func _addWorkspace(
        workspaces : StableBuffer.StableBuffer<WorkspaceId>,
        workspaceId : WorkspaceId,
    ) : () {
        if (StableBuffer.contains(workspaces, workspaceId, Principal.equal)) {
            return;
        };

        StableBuffer.add(workspaces, workspaceId);
    };

    private func getEventSubscriptions(event : Types.UserEvent) : [(Principal, Types.ProfileUpdatedSubscription)] {
        let eventSubscriptions = switch (event.event) {
            case (#profileUpdated({ profile })) {
                Map.get(canisterSubscriptions, userEventNameHash, #profileUpdated);
            };
        };

        switch (eventSubscriptions) {
            case (null) {
                return [];
            };
            case (?subscriptions) {
                return Iter.toArray(Map.entries(subscriptions));
            };
        };
    };

    private func checkCyclesBalance() : async () {
        let amount : Nat = _capacity - Cycles.balance();
        let userIndexCanister = actor (Principal.toText(userIndexCanisterId)) : actor {
            requestCycles : (amount : Nat) -> async {
                accepted : Nat64;
            };
        };
        let result = await userIndexCanister.requestCycles(amount);
        let accepted = result.accepted;
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
