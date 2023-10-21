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
import UUID "mo:uuid/UUID";

import CreateWorkspace "../../lib/workspaces/services/create_workspace";
import Types "../../lib/workspaces/types";
import CoreTypes "../../types";

import Workspace "../workspace/main";

actor WorkspaceIndex {
    type WorkspaceId = Types.WorkspaceId;
    type WorkspaceExternalId = UUID.UUID;

    // TODO: Move this to a library
    func compareUUIDs(a : UUID.UUID, b : UUID.UUID) : Order.Order {
        let listA : List.List<Nat8> = List.fromArray(a);
        let listB : List.List<Nat8> = List.fromArray(b);

        return List.compare<Nat8>(listA, listB, Nat8.compare);
    };

    /*************************************************************************
     * Stable data
     *************************************************************************/
    stable var stable_workspace_id_to_workspace_uuid : RBTree.Tree<WorkspaceId, WorkspaceExternalId> = #leaf;
    stable var stable_workspace_uuid_to_workspace_id : RBTree.Tree<WorkspaceExternalId, WorkspaceId> = #leaf;
    stable var stable_workspace_id_to_canister : RBTree.Tree<WorkspaceId, Workspace.Workspace> = #leaf;

    /*************************************************************************
     * Transient data
     *************************************************************************/

    var workspace_id_to_workspace_uuid : RBTree.RBTree<WorkspaceId, WorkspaceExternalId> = RBTree.RBTree<WorkspaceId, WorkspaceExternalId>(Principal.compare);
    var workspace_uuid_to_workspace_id : RBTree.RBTree<WorkspaceExternalId, WorkspaceId> = RBTree.RBTree<WorkspaceExternalId, WorkspaceId>(compareUUIDs);
    var workspace_id_to_canister : RBTree.RBTree<WorkspaceId, Workspace.Workspace> = RBTree.RBTree<WorkspaceId, Workspace.Workspace>(Principal.compare);

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

                #ok(workspaceId);
            };
        };
    };

    public shared func upgradeWorkspaceCanister(workspaceId : Principal) {
        let workspaceActor = switch (workspace_id_to_canister.get(workspaceId)) {
            case (null) { Debug.trap("Workspace actor not found") };
            case (?workspaceCanister) { workspaceCanister };
        };
        let workspace_index_principal = Principal.fromActor(WorkspaceIndex);

        ignore await (system Workspace.Workspace)(
            #upgrade(workspaceActor)
        )(await workspaceActor.getInitArgs(), await workspaceActor.getInitData());

        return;
    };

    /*
     * Get the balance of the wallet.
     */
    public shared (msg) func walletBalance() : async Nat {
        let balance = Cycles.balance();
        return balance;
    };

    /*************************************************************************
     * System functions
     *************************************************************************/

    system func preupgrade() {
        stable_workspace_id_to_workspace_uuid := workspace_id_to_workspace_uuid.share();
        stable_workspace_uuid_to_workspace_id := workspace_uuid_to_workspace_id.share();
        stable_workspace_id_to_canister := workspace_id_to_canister.share();
    };

    system func postupgrade() {
        stable_workspace_id_to_workspace_uuid := #leaf;
        stable_workspace_uuid_to_workspace_id := #leaf;
        stable_workspace_id_to_canister := #leaf;
    };
};
