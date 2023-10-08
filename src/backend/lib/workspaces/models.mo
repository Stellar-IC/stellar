import List "mo:base/List";
import Nat "mo:base/Nat";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../lib/blocks/types";
import ModelManager "../../utils/data/database/model_manager";
import DatabaseTypes "../../utils/data/database/types";
import IdManager "../../utils/data/id_manager";

import Types "./types";

module Models {
    public class Workspace(
        stable_id_manager_data : Nat,
        stable_data : RBTree.Tree<Nat, Types.Workspace>,
    ) {
        public var id_manager = IdManager.SingleModelIdManager(?stable_id_manager_data);
        public var objects = ModelManager.ModelManager<Nat, Types.Workspace, Types.UnsavedWorkspace>({
            pk_attr_name = "id";
            pk_compare = Nat.compare;
            pk_getter = func pk_getter(attr_name : Text, obj : Types.Workspace) : ?Types.PrimaryKey {
                if (attr_name == "id") {
                    return ?obj.id;
                };
                return null;
            };
            get_unique_pk = func() {
                return id_manager.generateId();
            };
            prepare_obj_for_insert = func(pk : Nat, obj : Types.UnsavedWorkspace) : Types.Workspace {
                return { obj and { id = pk } };
            };
            indexes = List.fromArray<DatabaseTypes.IndexConfig<Types.Workspace, Types.PrimaryKey>>([{
                field_name = "uuid";
                index_type = #unique;
                value_type = #text;
                add_value_to_index = func(attr_name : Text, obj : Types.Workspace, index : DatabaseTypes.Index<Text, Types.PrimaryKey>) : () {
                    index.put(UUID.toText(obj.uuid), obj.id);
                };
            }]);
            stable_data = stable_data;
        });
    };
};
