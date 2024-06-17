import UserIndex "canister:user_index";

import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Order "mo:base/Order";
import List "mo:base/List";
import Nat8 "mo:base/Nat8";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Nat "mo:base/Nat";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Error "mo:base/Error";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";
import Canistergeek "mo:canistergeek/canistergeek";
import Map "mo:map/Map";
import StableBuffer "mo:stablebuffer/StableBuffer";
import Source "mo:uuid/async/SourceV4";

import CanisterTopUp "../../lib/canister_top_up";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import CoreTypes "../../types";
import CyclesUtils "../../utils/cycles";
import UUIDUtils "../../utils/uuid";

import Workspace "../workspace/main";
import WorkspaceTypes "../workspace/types/v2";
import Constants "../../constants";
import Paginator "../../lib/pagination/paginator";
import PubSub "../../lib/pub_sub";
import AuthUtils "../../utils/auth";

actor WorkspaceIndex {
    type WorkspaceId = Principal;
    type WorkspaceExternalId = UUID.UUID;
    type WorkspaceDetails = {
        canisterId : Principal;
        name : Text;
    };

    type PubSubEvent = {};
    type EventHandler = shared (Text, PubSubEvent) -> async ();

    stable let MAX_TOP_UP_AMOUNT = 1_000_000_000_000_000;
    stable let MIN_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    /*************************************************************************
     * Stable data
     *************************************************************************/

    stable let _capacity = 100_000_000_000_000;
    stable var _balance = 0 : Nat;
    stable var _topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;
    stable let _workspaces = Map.new<Principal, WorkspaceDetails>();

    /*************************************************************************
     * Transient data
     *************************************************************************/

    let topUps = RBTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);
    topUps.unshare(_topUps);

    /*************************************************************************
     * Queries
     *************************************************************************/
    type WorkspaceDetailsItem = {
        id : Principal;
        result : { #found : WorkspaceDetails; #notFound };
    };
    type WorkspaceDetailsByIdOk = [WorkspaceDetailsItem];
    type WorkspaceDetailsByIdOutput = Result.Result<WorkspaceDetailsByIdOk, { #workspaceNotFound }>;

    public query func workspaceDetailsById(workspaceIds : [Principal]) : async WorkspaceDetailsByIdOutput {
        let result = Buffer.Buffer<WorkspaceDetailsItem>(Array.size(workspaceIds));

        for (workspaceId in workspaceIds.vals()) {
            let workspace = Map.get(_workspaces, Map.phash, workspaceId);

            switch (workspace) {
                case (null) {
                    result.add({
                        id = workspaceId;
                        result = #notFound;
                    });
                };
                case (?workspace) {
                    result.add({
                        id = workspaceId;
                        result = #found(workspace);
                    });
                };
            };
        };

        return #ok(Buffer.toArray(result));
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    /*
     * Add a workspace to the index.
     */
    public shared ({ caller }) func createWorkspace(
        input : {
            name : Text;
            description : Text;
        }
    ) : async Result.Result<Principal, { #AnonymousOwner; #Unauthorized; #InsufficientCycles }> {
        let { name; description } = input;

        // Assert that the caller is a registered user
        let user = switch (await UserIndex.userDetailsByIdentity(caller)) {
            case (#ok(user)) { user };
            case (#err(_)) { return #err(#Unauthorized) };
        };

        // Create the workspace
        let result = await CreateWorkspace.execute({
            name;
            description;
            owners = [caller];
            controllers = [caller, Principal.fromActor(WorkspaceIndex)];
            initialUsers = [(
                caller,
                {
                    identity = caller;
                    canisterId = user.canisterId;
                    role = #admin;
                    username = user.username;
                },
            )];
            userIndexCanisterId = Principal.fromActor(UserIndex);
        });

        switch (result) {
            case (#err(error)) { #err(error) };
            case (#ok(workspaceId)) {
                let workspace = actor (Principal.toText(workspaceId)) : Workspace.Workspace;
                saveWorkspaceDetails(workspaceId, { name });
                await workspace.subscribe("workspaceNameUpdated", handleWorkspaceEvents);
                #ok(workspaceId);
            };
        };
    };

    public shared ({ caller }) func handleWorkspaceEvents(eventName : Text, payload : WorkspaceTypes.PubSubEvent) : async () {
        if (Map.get(_workspaces, Map.phash, caller) == null) {
            Debug.trap("Caller is not a registered workspace");
        };

        // TODO: Throttle the rate at which workspaces can update their name

        switch (payload) {
            case (#workspaceNameUpdated(payload)) {
                let { name; workspaceId } = payload;

                if (caller != workspaceId) {
                    Debug.trap("Unauthorized");
                };

                let workspace = actor (Principal.toText(workspaceId)) : Workspace.Workspace;
                saveWorkspaceDetails(workspaceId, { name });
            };
        };
    };

    public shared ({ caller }) func upgradeWorkspace(workspaceId : Principal, wasm_module : Blob) : async Result.Result<(), { #unauthorized }> {
        if ((AuthUtils.isDev(caller)) == false) {
            return #err(#unauthorized);
        };

        let IC0 : CoreTypes.Management = actor "aaaaa-aa";
        let sender_canister_version : ?Nat64 = null;

        await IC0.install_code(
            {
                arg = to_candid (
                    // These values will not be used since the canister
                    // stores the init args as stable variables.
                    //
                    // TODO: Remove these values from the install_code
                    // and create a separate initialization function for the
                    // canister.
                    {
                        capacity = Constants.WORKSPACE__CAPACITY.scalar;
                        userIndexCanisterId = Principal.fromActor(UserIndex);
                        owner = caller;
                        owners = [];
                        name = "";
                        uuid = await Source.Source().new();
                        description = "";
                        initialUsers = [];
                        createdAt = Time.now();
                        updatedAt = Time.now();
                    },
                );
                canister_id = workspaceId;
                mode = #upgrade(?{ skip_pre_upgrade = ?false });
                sender_canister_version = sender_canister_version;
                wasm_module = wasm_module;
            }
        );

        #ok;
    };

    public shared ({ caller }) func upgradeWorkspaces(wasm_module : Blob) : async Result.Result<(), { #unauthorized }> {
        if ((AuthUtils.isDev(caller)) == false) {
            return #err(#unauthorized);
        };

        let IC0 : CoreTypes.Management = actor "aaaaa-aa";
        let sender_canister_version : ?Nat64 = null;

        for (canisterId in Map.keys(_workspaces)) {
            // try {
            await IC0.install_code(
                {
                    arg = to_candid (
                        // These values will not be used since the canister
                        // stores the init args as stable variables.
                        //
                        // TODO: Remove these values from the install_code
                        // and create a separate initialization function for the
                        // canister.
                        {
                            capacity = Constants.WORKSPACE__CAPACITY.scalar;
                            userIndexCanisterId = Principal.fromActor(UserIndex);
                            owners = [];
                            name = "";
                            uuid = await Source.Source().new();
                            description = "";
                            initialUsers = [];
                            createdAt = Time.now();
                            updatedAt = Time.now();
                        },
                    );
                    canister_id = canisterId;
                    mode = #upgrade(?{ skip_pre_upgrade = ?false });
                    sender_canister_version = sender_canister_version;
                    wasm_module = wasm_module;
                }
            );
            // } catch (err) {
            //     Debug.print(
            //         "Error upgrading workspace canister: " # debug_show (Error.code(err)) #
            //         ": " # debug_show (Error.message(err))
            //     );
            // };
        };

        #ok;
    };

    private func saveWorkspaceDetails(workspaceId : Principal, details : { name : Text }) {
        ignore Map.put<Principal, WorkspaceDetails>(
            _workspaces,
            Map.phash,
            workspaceId,
            {
                canisterId = workspaceId;
                name = details.name;
            },
        );
    };

    /*************************************************************************
     * Cycles Management
     *************************************************************************/

    // Returns the cycles received up to the capacity allowed
    public func walletReceive() : async { accepted : Nat64 } {
        let limit : Nat = _capacity - _balance;
        let result = await CyclesUtils.walletReceive(limit);
        _balance += Nat64.toNat(result.accepted);
        return result;
    };

    public shared ({ caller }) func requestCycles(amount : Nat) : async {
        accepted : Nat64;
    } {
        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_INTERVAL;
        let currentBalance = Cycles.balance();
        let now = Time.now();

        let workspace = switch (Map.get(_workspaces, Map.phash, caller)) {
            case (null) {
                Debug.trap("Caller is not a registered workspace");
            };
            case (?{ canisterId }) {
                actor (Principal.toText(canisterId)) : Workspace.Workspace;
            };
        };

        var topUp = switch (topUps.get(caller)) {
            case (null) {
                Debug.trap("Top-ups not set for canister");
            };
            case (?topUp) { topUp };
        };

        let shouldThrottle = switch (topUp.latestTopUp) {
            case (null) { false };
            case (?latestTopUp) {
                latestTopUp + minInterval > now;
            };
        };

        if (topUp.topUpInProgress) {
            Debug.trap("Top up in progress");
        } else if (amount > maxAmount) {
            Debug.trap("Amount too high");
        } else if (shouldThrottle) {
            Debug.trap("Throttled");
        } else {
            CanisterTopUp.setTopUpInProgress(topUp, true);
            ExperimentalCycles.add(amount);
            let result = await workspace.walletReceive();
            CanisterTopUp.setTopUpInProgress(topUp, false);
            return result;
        };
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
     * System functions
     *************************************************************************/

    system func preupgrade() {
        _topUps := topUps.share();
        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        _topUps := #leaf;
        doCanisterGeekPostUpgrade();
    };
};
