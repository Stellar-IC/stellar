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
import UUID "mo:uuid/UUID";
import Canistergeek "mo:canistergeek/canistergeek";

import CanisterTopUp "../../lib/shared/CanisterTopUp";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import CoreTypes "../../types";
import CyclesUtils "../../utils/cycles";
import UUIDUtils "../../utils/uuid";

import Workspace "../workspace/main";
import WorkspaceTypes "../workspace/types/v2";
import Constants "../../constants";
import Paginator "../../lib/pagination/Paginator";

actor WorkspaceIndex {
    type WorkspaceId = Principal;
    type WorkspaceExternalId = UUID.UUID;

    stable let MAX_TOP_UP_AMOUNT = 1_000_000_000_000_000;
    stable let MIN_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours

    /*************************************************************************
     * Stable data
     *************************************************************************/
    stable var _workspace_id_to_workspace_uuid : RBTree.Tree<WorkspaceId, WorkspaceExternalId> = #leaf;
    stable var _workspace_uuid_to_workspace_id : RBTree.Tree<WorkspaceExternalId, WorkspaceId> = #leaf;
    stable var _workspace_id_to_canister : RBTree.Tree<WorkspaceId, Workspace.Workspace> = #leaf;

    stable let _capacity = 100_000_000_000_000;
    stable var _balance = 0 : Nat;
    stable var _topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    /*************************************************************************
     * Transient data
     *************************************************************************/

    var workspace_id_to_workspace_uuid : RBTree.RBTree<WorkspaceId, WorkspaceExternalId> = RBTree.RBTree<WorkspaceId, WorkspaceExternalId>(Principal.compare);
    var workspace_uuid_to_workspace_id : RBTree.RBTree<WorkspaceExternalId, WorkspaceId> = RBTree.RBTree<WorkspaceExternalId, WorkspaceId>(UUIDUtils.compare);
    var workspace_id_to_canister : RBTree.RBTree<WorkspaceId, Workspace.Workspace> = RBTree.RBTree<WorkspaceId, Workspace.Workspace>(Principal.compare);
    let topUps = RBTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    workspace_id_to_workspace_uuid.unshare(_workspace_id_to_workspace_uuid);
    workspace_uuid_to_workspace_id.unshare(_workspace_uuid_to_workspace_id);
    workspace_id_to_canister.unshare(_workspace_id_to_canister);
    topUps.unshare(_topUps);

    /*************************************************************************
     * Updates
     *************************************************************************/

    /*
     * Add a workspace to the index.
     */
    public shared ({ caller }) func createWorkspace(
        input : { owner : Principal }
    ) : async Result.Result<Principal, { #anonymousCaller; #anonymousUser; #unauthorizedCaller; #insufficientCycles }> {
        let result = await CreateWorkspace.execute({
            owner = input.owner;
            controllers = [input.owner, Principal.fromActor(WorkspaceIndex)];
            initialUsers = [];
        });

        switch (result) {
            case (#err(error)) { #err(error) };
            case (#ok(workspace)) {
                let workspaceId = Principal.fromActor(workspace);
                let workspaceData = await workspace.toObject();

                workspace_id_to_workspace_uuid.put(workspaceId, workspaceData.uuid);
                workspace_uuid_to_workspace_id.put(workspaceData.uuid, workspaceId);
                workspace_id_to_canister.put(workspaceId, workspace);

                // CyclesDispenser.register(workspace);

                #ok(workspaceId);
            };
        };
    };

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

        let workspace = switch (workspace_id_to_canister.get(caller)) {
            case (null) {
                Debug.trap("Caller is not a registered workspace");
            };
            case (?user) { user };
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
        _workspace_id_to_workspace_uuid := workspace_id_to_workspace_uuid.share();
        _workspace_uuid_to_workspace_id := workspace_uuid_to_workspace_id.share();
        _workspace_id_to_canister := workspace_id_to_canister.share();
        _topUps := topUps.share();
        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        _workspace_id_to_workspace_uuid := #leaf;
        _workspace_uuid_to_workspace_id := #leaf;
        _workspace_id_to_canister := #leaf;
        _topUps := #leaf;
        doCanisterGeekPostUpgrade();
    };
};
