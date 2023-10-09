import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import UUID "mo:uuid/UUID";

import Workspace "../workspace/main";
import WorkspaceModels "./model/models/workspace";
import State "./model/state";
import CreateWorkspace "./services/create_workspace";
import Types "./types";

actor WorkspaceIndex {
    stable var stable_principal_to_workspace_uuid : RBTree.Tree<Types.WorkspaceId, UUID.UUID> = #leaf;
    stable var stable_workspace_uuid_to_principal : RBTree.Tree<UUID.UUID, Types.WorkspaceId> = #leaf;
    stable var stable_workspaces : RBTree.Tree<Types.WorkspaceId, Types.Workspace> = #leaf;
    stable var stable_workspace_id_to_canister : RBTree.Tree<Types.WorkspaceId, Workspace.Workspace> = #leaf;

    /*************************************************************************
     * Stable data
     *************************************************************************/

    var stable_data = {
        principal_to_workspace_uuid = stable_principal_to_workspace_uuid;
        workspace_uuid_to_principal = stable_workspace_uuid_to_principal;
        workspace_id_to_canister = stable_workspace_id_to_canister;
        workspaces = stable_workspaces;
    };

    /*************************************************************************
     * Transient data
     *************************************************************************/

    var state = State.State(State.Data(stable_data));

    /*************************************************************************
     * Queries
     *************************************************************************/

    public query ({ caller }) func workspaceByUuid(uuid : UUID.UUID) : async ?Types.Workspace {
        // TODO: Add security checks:
        // - Is the user allowed to access this workspace?

        return state.data.getWorkspaceByUuid(uuid);
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    /*
     * Add a workspace to the index.
     */
    public shared ({ caller }) func createWorkspace(
        input : {
            owner : Principal;
        }
    ) : async Result.Result<Principal, { #anonymousCaller; #anonymousOwner; #anonymousWorkspaceIndex; #unauthorizedCaller; #insufficientCycles }> {
        let workspace_index_principal = Principal.fromActor(WorkspaceIndex);
        let result = await CreateWorkspace.createWorkspace(
            state,
            input.owner,
            workspace_index_principal,
        );

        switch (result) {
            case (#err(#anonymousUser)) {
                return #err(#anonymousOwner);
            };
            case (#err(#anonymousWorkspaceIndex)) {
                return #err(#anonymousWorkspaceIndex);
            };
            case (#err(#insufficientCycles)) {
                return #err(#insufficientCycles);
            };
            case (#ok(workspace)) {
                return #ok(workspace);
            };
        };
    };

    public shared func upgradeWorkspaceCanister(workspaceId : Principal) {
        let workspaceActor = state.data.getWorkspaceActor(workspaceId);
        let workspace_index_principal = Principal.fromActor(WorkspaceIndex);

        switch (workspaceActor) {
            case (null) {
                Debug.trap("Workspace actor not found");
            };
            case (?workspaceActor) {
                ignore await (system Workspace.Workspace)(
                    #upgrade(workspaceActor)
                )(await workspaceActor.getInitArgs());
            };
        };

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
        stable_principal_to_workspace_uuid := state.data.principal_to_workspace_uuid.share();
        stable_workspace_uuid_to_principal := state.data.workspace_uuid_to_principal.share();
        stable_workspaces := state.data.Workspace.objects.data.share();
        stable_workspace_id_to_canister := state.data.workspace_id_to_canister.share();
    };

    system func postupgrade() {
        stable_principal_to_workspace_uuid := #leaf;
        stable_workspace_uuid_to_principal := #leaf;
        stable_workspaces := #leaf;
        stable_workspace_id_to_canister := #leaf;
    };
};
