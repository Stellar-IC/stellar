import RBTree "mo:base/RBTree";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import List "mo:base/List";
import Order "mo:base/Order";
import Nat8 "mo:base/Nat8";
import UUID "mo:uuid/UUID";

import IdManager "../../../utils/data/id_manager";
import WorkspaceActor "../../workspace/main";

import Types "../types";
import { Workspace = WorkspaceModel } "./models/workspace";
import Workspace "models/workspace";

module {
    type WorkspaceId = Types.WorkspaceId;
    type Workspace = Types.Workspace;
    type UnsavedWorkspace = Types.UnsavedWorkspace;

    public class State(_data : Data) {
        public var data = _data;
    };

    func compareUUIDs(a : UUID.UUID, b : UUID.UUID) : Order.Order {
        let listA : List.List<Nat8> = List.fromArray(a);
        let listB : List.List<Nat8> = List.fromArray(b);

        return List.compare<Nat8>(listA, listB, Nat8.compare);
    };

    public class Data(
        initial_value : {
            workspaces : RBTree.Tree<WorkspaceId, Workspace>;
            principal_to_workspace_uuid : RBTree.Tree<WorkspaceId, UUID.UUID>;
            workspace_uuid_to_principal : RBTree.Tree<UUID.UUID, WorkspaceId>;
            workspace_id_to_canister : RBTree.Tree<WorkspaceId, WorkspaceActor.Workspace>;
        }
    ) {
        // Set up models
        public var Workspace = WorkspaceModel(initial_value.workspaces);

        // Set up indexes
        public var principal_to_workspace_uuid = RBTree.RBTree<WorkspaceId, UUID.UUID>(Principal.compare);
        principal_to_workspace_uuid.unshare(initial_value.principal_to_workspace_uuid);

        public var workspace_uuid_to_principal = RBTree.RBTree<UUID.UUID, WorkspaceId>(compareUUIDs);
        workspace_uuid_to_principal.unshare(initial_value.workspace_uuid_to_principal);

        public var workspace_id_to_canister = RBTree.RBTree<WorkspaceId, WorkspaceActor.Workspace>(Principal.compare);
        workspace_id_to_canister.unshare(initial_value.workspace_id_to_canister);

        /*************************************************************************
         * CRUD Operations
         *************************************************************************/

        /**
         * Add a workspace to the database.
         *
         * @param principal The principal that is adding the workspace.
         * @param input The workspace to add.
         * @return The id of the workspace that was added.
         */
        public func addWorkspace(
            principal : Principal,
            input : UnsavedWorkspace,
            canister : WorkspaceActor.Workspace,
        ) : Result.Result<(WorkspaceId, Workspace), { #keyAlreadyExists }> {
            workspace_id_to_canister.put(
                principal,
                canister,
            );

            return Workspace.objects.insert(input);
        };

        /**
         * Get a workspace from the database.
         *
         * @param id The id of the workspace to get.
         * @return The workspace with the given id.
         */
        public func getWorkspace(id : WorkspaceId) : ?Workspace {
            return Workspace.objects.get(id);
        };

        public func getWorkspaceActor(id : WorkspaceId) : ?WorkspaceActor.Workspace {
            return workspace_id_to_canister.get(id);
        };

        /**
         * Get a workspace from the database.
         *
         * @param uuid The uuid of the workspace to get.
         * @return The workspace with the given uuid.
         */
        public func getWorkspaceByUuid(uuid : UUID.UUID) : ?Workspace {
            return Workspace.objects.indexFilter(
                "uuid",
                #text(UUID.toText(uuid)),
            ).first();
        };

        /**
         * Delete a workspace from the database.
         *
         * @param id The id of the workspace to delete.
         */
        public func deleteWorkspace(id : WorkspaceId) : () {
            return Workspace.objects.delete(id);
        };
    };
};
