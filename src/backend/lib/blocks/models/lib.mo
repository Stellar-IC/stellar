import List "mo:base/List";
import Nat "mo:base/Nat";
import Order "mo:base/Order";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Hash "mo:base/Hash";
import Debug "mo:base/Debug";
import UUID "mo:uuid/UUID";

import ModelManager "../../../utils/data/database/model_manager";
import DatabaseTypes "../../../utils/data/database/types";
import IdManager "../../../utils/data/id_manager";
import Tree "../../../utils/data/lseq/Tree";

import Types "../types";

module Models {
    public module Block = {
        type ShareableBlock = Types.ShareableBlock;
        type Block = Types.Block;
        type BlockProperties = Types.BlockProperties;
        type BlockText = Types.BlockText;
        type UnsavedBlock = Types.UnsavedBlock;
        type BlockContent = Types.BlockContent;
        type ShareableBlockProperties = Types.ShareableBlockProperties;
        type ShareableBlockText = Types.ShareableBlockText;
        type ShareableUnsavedBlock = Types.ShareableUnsavedBlock;

        public class Model(
            stable_id_manager_data : Nat,
            stable_data : RBTree.Tree<Nat, ShareableBlock>,
        ) {
            public var id_manager = IdManager.SingleModelIdManager(?stable_id_manager_data);
            public var objects = ModelManager.ModelManager<Nat, Block, UnsavedBlock>({
                pk_attr_name = "id";
                pk_compare = Nat.compare;
                pk_getter = func pk_getter(attr_name : Text, obj : Block) : ?Types.PrimaryKey {
                    if (attr_name == "id") {
                        return ?obj.id;
                    };
                    return null;
                };
                get_unique_pk = func() {
                    return id_manager.generateId();
                };
                prepare_obj_for_insert = func(pk : Nat, obj : UnsavedBlock) : Block {
                    return {
                        id = pk;
                        var blockType = obj.blockType;
                        parent = obj.parent;
                        content = obj.content;
                        properties = obj.properties;
                        uuid = obj.uuid;
                    };
                };
                indexes = List.fromArray<DatabaseTypes.IndexConfig<Block, Types.PrimaryKey>>([{
                    field_name = "uuid";
                    index_type = #unique;
                    value_type = #text;
                    add_value_to_index = func(attr_name : Text, obj : Block, index : DatabaseTypes.Index<Text, Types.PrimaryKey>) : () {
                        index.put(UUID.toText(obj.uuid), obj.id);
                    };
                }]);
                stable_data = switch (stable_data) {
                    case (#leaf) { #leaf };
                    case (#node(stable_data)) {
                        let refreshData = RBTree.RBTree<Nat, ShareableBlock>(Nat.compare);
                        refreshData.unshare(#node(stable_data));

                        let data = RBTree.RBTree<Nat, ShareableBlock>(Nat.compare);
                        let transformedData = RBTree.RBTree<Nat, Block>(Nat.compare);
                        for (entry in refreshData.entries()) {
                            transformedData.put(entry.0, fromShareable(entry.1));
                        };
                        transformedData.share();
                    };
                };
            });
        };

        public func fromShareable(input : ShareableBlock) : Block {
            let title : BlockText = switch (input.properties.title) {
                case (null) {
                    Tree.Tree(null);
                };
                case (?title) {
                    Tree.fromShareableTree(title);
                };
            };
            let properties : BlockProperties = {
                title = ?title;
                var checked = input.properties.checked;
            };

            return {
                input with properties = properties;
                content = input.content;
                var blockType = input.blockType;
            };
        };

        public func fromShareableUnsaved(input : ShareableUnsavedBlock) : UnsavedBlock {
            let title : BlockText = switch (input.properties.title) {
                case (null) { Tree.Tree(null) };
                case (?title) {
                    Tree.fromShareableTree(title);
                };
            };
            let properties : BlockProperties = {
                title = ?title;
                var checked = input.properties.checked;
            };

            return {
                input with properties = properties;
                content = input.content;
                var blockType = input.blockType;
            };
        };

        public func toShareable(input : Block) : ShareableBlock {
            let shareableTitle : ShareableBlockText = switch (input.properties.title) {
                case (null) {
                    Tree.toShareableTree(Tree.Tree(null));
                };
                case (?title) {
                    Tree.toShareableTree(title);
                };
            };
            let shareableProperties : ShareableBlockProperties = {
                title = ?shareableTitle;
                checked = input.properties.checked;
            };

            return {
                input with properties = shareableProperties;
                content = input.content;
                blockType = input.blockType;
            };
        };

    };

    public module Block_v2 = {
        type ShareableBlock = Types.ShareableBlock_v2;
        type Block = Types.Block_v2;
        type BlockProperties = Types.BlockProperties;
        type BlockText = Types.BlockText;
        type UnsavedBlock = Types.UnsavedBlock_v2;
        type BlockContent = Types.BlockContent_v2;
        type ShareableBlockContent = Types.ShareableBlockContent;
        type ShareableBlockProperties = Types.ShareableBlockProperties;
        type ShareableBlockText = Types.ShareableBlockText;
        type ShareableUnsavedBlock = Types.ShareableUnsavedBlock_v2;

        public class Model(
            stable_id_manager_data : Nat,
            stable_data : RBTree.Tree<Nat, ShareableBlock>,
        ) {
            public var id_manager = IdManager.SingleModelIdManager(?stable_id_manager_data);
            public var objects = ModelManager.ModelManager<Nat, Block, UnsavedBlock>({
                pk_attr_name = "id";
                pk_compare = Nat.compare;
                pk_getter = func pk_getter(attr_name : Text, obj : Block) : ?Types.PrimaryKey {
                    if (attr_name == "id") {
                        return ?obj.id;
                    };
                    return null;
                };
                get_unique_pk = func() {
                    return id_manager.generateId();
                };
                prepare_obj_for_insert = func(pk : Nat, obj : UnsavedBlock) : Block {
                    return {
                        id = pk;
                        var blockType = obj.blockType;
                        var parent = obj.parent;
                        content = obj.content;
                        properties = obj.properties;
                        uuid = obj.uuid;
                    };
                };
                indexes = List.fromArray<DatabaseTypes.IndexConfig<Block, Types.PrimaryKey>>([{
                    field_name = "uuid";
                    index_type = #unique;
                    value_type = #text;
                    add_value_to_index = func(attr_name : Text, obj : Block, index : DatabaseTypes.Index<Text, Types.PrimaryKey>) : () {
                        index.put(UUID.toText(obj.uuid), obj.id);
                    };
                }]);
                stable_data = switch (stable_data) {
                    case (#leaf) { #leaf };
                    case (#node(stable_data)) {
                        let refreshData = RBTree.RBTree<Nat, ShareableBlock>(Nat.compare);
                        refreshData.unshare(#node(stable_data));

                        let data = RBTree.RBTree<Nat, ShareableBlock>(Nat.compare);
                        let transformedData = RBTree.RBTree<Nat, Block>(Nat.compare);
                        for (entry in refreshData.entries()) {
                            transformedData.put(entry.0, fromShareable(entry.1));
                        };
                        transformedData.share();
                    };
                };
            });
        };

        public func fromShareable(input : ShareableBlock) : Block {
            let title : BlockText = switch (input.properties.title) {
                case (null) {
                    Tree.Tree(null);
                };
                case (?title) {
                    Tree.fromShareableTree(title);
                };
            };
            let content : BlockContent = Tree.fromShareableTree(input.content);
            let properties : BlockProperties = {
                title = ?title;
                var checked = input.properties.checked;
            };

            return {
                input with properties = properties;
                content = content;
                var blockType = input.blockType;
                var parent = input.parent;
            };
        };

        public func fromShareableUnsaved(input : ShareableUnsavedBlock) : UnsavedBlock {
            let title : BlockText = switch (input.properties.title) {
                case (null) { Tree.Tree(null) };
                case (?title) {
                    Tree.fromShareableTree(title);
                };
            };
            let content : BlockContent = Tree.fromShareableTree(input.content);
            let properties : BlockProperties = {
                title = ?title;
                var checked = input.properties.checked;
            };

            return {
                input with properties = properties;
                content = content;
                var blockType = input.blockType;
                var parent = input.parent;
            };
        };

        public func toShareable(input : Block) : ShareableBlock {
            let shareableTitle : ShareableBlockText = switch (input.properties.title) {
                case (null) {
                    Tree.toShareableTree(Tree.Tree(null));
                };
                case (?title) {
                    Tree.toShareableTree(title);
                };
            };
            let shareableContent : ShareableBlockContent = Tree.toShareableTree(input.content);
            let shareableProperties : ShareableBlockProperties = {
                title = ?shareableTitle;
                checked = input.properties.checked;
            };

            return {
                input with properties = shareableProperties;
                content = shareableContent;
                blockType = input.blockType;
                parent = input.parent;
            };
        };

    };
};
