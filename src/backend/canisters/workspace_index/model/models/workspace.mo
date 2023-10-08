import List "mo:base/List";
import Nat "mo:base/Nat";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import UUID "mo:uuid/UUID";

import ModelManager "../../../../utils/data/database/model_manager";
import DatabaseTypes "../../../../utils/data/database/types";
import IdManager "../../../../utils/data/id_manager";

import Types "../../types";

module Workspace {
    public class Workspace(
        stable_data : RBTree.Tree<Types.WorkspaceId, Types.Workspace>
    ) {
        public var objects = ModelManager.ModelManager<Types.WorkspaceId, Types.Workspace, Types.UnsavedWorkspace>({
            pk_attr_name = "id";
            pk_compare = Principal.compare;
            pk_getter = func pk_getter(attr_name : Text, obj : Types.Workspace) : ?Types.WorkspaceId {
                if (attr_name == "id") {
                    return ?obj.id;
                };
                return null;
            };
            get_unique_pk = func() {
                // TODO: Fix this
                // Returning anonymour principal for now
                return Principal.fromText("2vxsx-fae");
            };
            prepare_obj_for_insert = func(pk : Types.WorkspaceId, obj : Types.UnsavedWorkspace) : Types.Workspace {
                return { obj and { id = pk } };
            };
            indexes = List.fromArray<DatabaseTypes.IndexConfig<Types.Workspace, Types.WorkspaceId>>([{
                field_name = "uuid";
                index_type = #unique;
                value_type = #text;
                add_value_to_index = func(attr_name : Text, obj : Types.Workspace, index : DatabaseTypes.Index<Text, Types.WorkspaceId>) : () {
                    index.put(UUID.toText(obj.uuid), obj.id);
                };
            }]);
            stable_data = stable_data;
        });
    };
};
