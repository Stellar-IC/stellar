import List "mo:base/List";
import Nat "mo:base/Nat";
import Order "mo:base/Order";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Hash "mo:base/Hash";
import Debug "mo:base/Debug";
import UUID "mo:uuid/UUID";

import ModelManager "../../../../utils/data/database/model_manager";
import DatabaseTypes "../../../../utils/data/database/types";
import IdManager "../../../../utils/data/id_manager";
import Tree "../../../../utils/data/lseq/Tree";

import Types "../../types";

module Block {
    public class Block(
        stable_id_manager_data : Nat,
        stable_data : RBTree.Tree<Nat, Types.ShareableBlock>,
    ) {
        public var id_manager = IdManager.SingleModelIdManager(?stable_id_manager_data);
        public var objects = ModelManager.ModelManager<Nat, Types.Block, Types.UnsavedBlock>({
            pk_attr_name = "id";
            pk_compare = Nat.compare;
            pk_getter = func pk_getter(attr_name : Text, obj : Types.Block) : ?Types.PrimaryKey {
                if (attr_name == "id") {
                    return ?obj.id;
                };
                return null;
            };
            get_unique_pk = func() {
                return id_manager.generateId();
            };
            prepare_obj_for_insert = func(pk : Nat, obj : Types.UnsavedBlock) : Types.Block {
                return {
                    id = pk;
                    blockType = obj.blockType;
                    parent = obj.parent;
                    var content = obj.content;
                    properties = obj.properties;
                    uuid = obj.uuid;
                };
            };
            indexes = List.fromArray<DatabaseTypes.IndexConfig<Types.Block, Types.PrimaryKey>>([{
                field_name = "uuid";
                index_type = #unique;
                value_type = #text;
                add_value_to_index = func(attr_name : Text, obj : Types.Block, index : DatabaseTypes.Index<Text, Types.PrimaryKey>) : () {
                    index.put(UUID.toText(obj.uuid), obj.id);
                };
            }]);
            stable_data = switch (stable_data) {
                case (#leaf) { #leaf };
                case (#node(stable_data)) {
                    let refreshData = RBTree.RBTree<Nat, Types.ShareableBlock>(Nat.compare);
                    refreshData.unshare(#node(stable_data));

                    let data = RBTree.RBTree<Nat, Types.ShareableBlock>(Nat.compare);
                    let transformedData = RBTree.RBTree<Nat, Types.Block>(Nat.compare);
                    for (entry in refreshData.entries()) {
                        transformedData.put(entry.0, fromShareable(entry.1));
                        Debug.print(debug_show (UUID.toText(entry.1.uuid)));
                    };
                    transformedData.share();
                };
            };
        });
    };

    public func fromShareable(input : Types.ShareableBlock) : Types.Block {
        let title : Types.BlockText = switch (input.properties.title) {
            case (null) {
                Tree.Tree(null);
            };
            case (?title) {
                Tree.fromShareableTree(title);
            };
        };
        let properties : Types.BlockProperties = {
            input.properties with title = ?title;
        };

        return {
            input with properties = properties;
            var content = input.content;
        };
    };

    public func fromShareableUnsaved(input : Types.ShareableUnsavedBlock) : Types.UnsavedBlock {
        let title : Types.BlockText = switch (input.properties.title) {
            case (null) { Tree.Tree(null) };
            case (?title) {
                Tree.fromShareableTree(title);
            };
        };
        let properties : Types.BlockProperties = {
            input.properties with title = ?title;
        };

        return {
            input with properties = properties;
            var content = input.content;
        };
    };

    public func toShareable(input : Types.Block) : Types.ShareableBlock {
        let shareableTitle : Types.ShareableBlockText = switch (input.properties.title) {
            case (null) {
                Tree.toShareableTree(Tree.Tree(null));
            };
            case (?title) {
                Tree.toShareableTree(title);
            };
        };
        let shareableProperties : Types.ShareableBlockProperties = {
            input.properties with title = ?shareableTitle;
        };

        return {
            input with properties = shareableProperties;
            content = input.content;
        };
    };
};
