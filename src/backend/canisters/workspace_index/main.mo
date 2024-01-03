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

import CanisterTopUp "../../lib/shared/CanisterTopUp";
import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import Types "../../lib/workspaces/types";
import CoreTypes "../../types";
import CyclesUtils "../../utils/cycles";

import Workspace "../workspace/main";
import Constants "../../constants";

actor WorkspaceIndex {
    type WorkspaceId = Types.WorkspaceId;
    type WorkspaceExternalId = UUID.UUID;

    // TODO: Move this to a library
    func compareUUIDs(a : UUID.UUID, b : UUID.UUID) : Order.Order {
        let listA : List.List<Nat8> = List.fromArray(a);
        let listB : List.List<Nat8> = List.fromArray(b);

        return List.compare<Nat8>(listA, listB, Nat8.compare);
    };

    stable let MAX_TOP_UP_AMOUNT = 1_000_000_000_000_000;
    stable let MIN_INTERVAL = 3 * 60 * 60 * 1_000_000_000_000; // 3 hours
    stable let MIN_BALANCE = 10_000_000_000_000; // 10 cycles

    /*************************************************************************
     * Stable data
     *************************************************************************/
    stable var stable_workspace_id_to_workspace_uuid : RBTree.Tree<WorkspaceId, WorkspaceExternalId> = #leaf;
    stable var stable_workspace_uuid_to_workspace_id : RBTree.Tree<WorkspaceExternalId, WorkspaceId> = #leaf;
    stable var stable_workspace_id_to_canister : RBTree.Tree<WorkspaceId, Types.MockWorkspaceActor> = #leaf;

    stable let stable_capacity = 100_000_000_000_000;
    stable var stable_balance = 0 : Nat;
    stable var stable_topUps : RBTree.Tree<Principal, CanisterTopUp.CanisterTopUp> = #leaf;

    /*************************************************************************
     * Transient data
     *************************************************************************/

    var workspace_id_to_workspace_uuid : RBTree.RBTree<WorkspaceId, WorkspaceExternalId> = RBTree.RBTree<WorkspaceId, WorkspaceExternalId>(Principal.compare);
    var workspace_uuid_to_workspace_id : RBTree.RBTree<WorkspaceExternalId, WorkspaceId> = RBTree.RBTree<WorkspaceExternalId, WorkspaceId>(compareUUIDs);
    var workspace_id_to_canister : RBTree.RBTree<WorkspaceId, Types.MockWorkspaceActor> = RBTree.RBTree<WorkspaceId, Types.MockWorkspaceActor>(Principal.compare);
    let topUps = RBTree.RBTree<Principal, CanisterTopUp.CanisterTopUp>(Principal.compare);

    workspace_id_to_workspace_uuid.unshare(stable_workspace_id_to_workspace_uuid);
    workspace_uuid_to_workspace_id.unshare(stable_workspace_uuid_to_workspace_id);
    workspace_id_to_canister.unshare(stable_workspace_id_to_canister);
    topUps.unshare(stable_topUps);

    /*************************************************************************
     * Queries
     *************************************************************************/

    public shared ({ caller }) func workspaceByUuid(uuid : UUID.UUID) : async Types.Workspace {
        // TODO: Add security checks:
        // - Is the user allowed to access this workspace?
        let workspace_id = switch (workspace_uuid_to_workspace_id.get(uuid)) {
            case (null) { Debug.trap("Workspace ID not found") };
            case (?workspace_id) { workspace_id };
        };
        let workspace_canister = switch (workspace_id_to_canister.get(workspace_id)) {
            case (null) { Debug.trap("Workspace Canister not found") };
            case (?workspace_id) { workspace_id };
        };

        return await workspace_canister.toObject();
    };

    public shared ({ caller }) func workspaces(
        options : {
            // cursor : ?PrimaryKey;
            // limit : ?Nat;
            // order : ?CoreTypes.SortOrder;
        }
    ) : async CoreTypes.PaginatedResults<Types.Workspace> {
        // let { cursor, limit; order } = options;
        var workspaces : List.List<Types.Workspace> = List.fromArray<Types.Workspace>([]);

        for ((workspaceId, workspaceCanister) in workspace_id_to_canister.entries()) {
            let workspace = await workspaceCanister.toObject();
            workspaces := List.append<Types.Workspace>(workspaces, List.fromArray([workspace]));
        };

        let result = {
            edges = List.toArray<CoreTypes.Edge<Types.Workspace>>(
                List.map<Types.Workspace, CoreTypes.Edge<Types.Workspace>>(
                    workspaces,
                    func(workspace) {
                        { node = workspace };
                    },
                )
            );
        };

        return result;
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    /*
     * Add a workspace to the index.
     */
    public shared ({ caller }) func createWorkspace(
        input : { owner : Principal }
    ) : async Result.Result<Principal, { #anonymousCaller; #anonymousUser; #unauthorizedCaller; #insufficientCycles }> {
        let result = await CreateWorkspace.execute({ owner = input.owner });

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

    // public shared func upgradeWorkspaceCanister(workspaceId : Principal) {
    //     let workspaceActor = switch (workspace_id_to_canister.get(workspaceId)) {
    //         case (null) { Debug.trap("Workspace actor not found") };
    //         case (?workspaceCanister) { workspaceCanister };
    //     };
    //     let workspace_index_principal = Principal.fromActor(WorkspaceIndex);
    //     let workspaceCanisterInitArgs = {
    //         capacity = workspaceActor.capacity;
    //         owner = workspaceActor.owner;
    //     };

    //     let now = Time.now();
    //     let workspaceCanisterInitData = {
    //         uuid = await Source.Source().new();
    //         name = "";
    //         description = "";
    //         createdAt = workspaceActor.createdAt;
    //         updatedAt = workspaceActor.updatedAt;
    //     };

    //     ignore await (system Workspace.Workspace)(
    //         #upgrade(workspaceActor)
    //     )(
    //         {

    //         },
    //         await workspaceActor.getInitData(),
    //     );

    //     return;
    // };

    // Returns the cycles received up to the capacity allowed
    public func walletReceive() : async { accepted : Nat64 } {
        let limit : Nat = stable_capacity - stable_balance;
        let result = await CyclesUtils.walletReceive(limit);
        stable_balance += Nat64.toNat(result.accepted);
        return result;
    };

    public shared func cyclesInformation() : async {
        balance : Nat;
        capacity : Nat;
    } {
        return { balance = Cycles.balance(); capacity = stable_capacity };
    };

    public shared ({ caller }) func requestCycles(amount : Nat) : async {
        accepted : Nat64;
    } {

        let maxAmount = MAX_TOP_UP_AMOUNT;
        let minInterval = MIN_INTERVAL;
        let minBalance = MIN_BALANCE;
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
        } else if (currentBalance < minBalance + amount) {
            Debug.trap("Balance too low");
        } else {
            CanisterTopUp.setTopUpInProgress(topUp, true);
            ExperimentalCycles.add(amount);
            let result = await workspace.walletReceive();
            CanisterTopUp.setTopUpInProgress(topUp, false);
            return result;
        };
    };

    /*************************************************************************
     * System functions
     *************************************************************************/

    system func preupgrade() {
        stable_workspace_id_to_workspace_uuid := workspace_id_to_workspace_uuid.share();
        stable_workspace_uuid_to_workspace_id := workspace_uuid_to_workspace_id.share();
        stable_workspace_id_to_canister := workspace_id_to_canister.share();
        stable_topUps := topUps.share();
    };

    system func postupgrade() {
        stable_workspace_id_to_workspace_uuid := #leaf;
        stable_workspace_uuid_to_workspace_id := #leaf;
        stable_workspace_id_to_canister := #leaf;
        stable_topUps := #leaf;
    };
};
