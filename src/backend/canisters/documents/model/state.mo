import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";
import RBTree "mo:base/RBTree";
import TrieMap "mo:base/TrieMap";
import Bool "mo:base/Bool";
import Result "mo:base/Result";
import Order "mo:base/Order";
import UUID "mo:uuid/UUID";

import IdManager "../../../utils/data/id_manager";

import Types "../types";
import CoreTypes "../../../types";
import { Block = BlockModel } "./models/block";

module {
    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data(
        initial_value : {
            blocks : {
                id : Nat;
                data : RBTree.Tree<Types.PrimaryKey, Types.ShareableBlock>;
            };
        }
    ) {
        public var Block = BlockModel(initial_value.blocks.id, initial_value.blocks.data);

        // Red-black trees to index orders by product ID and products by order ID
        var blocks_by_parent_uuid = RBTree.RBTree<Text, List.List<Types.PrimaryKey>>(Text.compare);

        public func addBlock(input : Types.UnsavedBlock) : Result.Result<(Types.PrimaryKey, Types.Block), { #keyAlreadyExists }> {
            let insert_result = Block.objects.insert(input);
            switch insert_result {
                case (#ok(pk, block)) {
                    _addBlockToBlocksByParentIdIndex(block);
                };
                case (#err(#keyAlreadyExists)) {
                    return #err(#keyAlreadyExists);
                };
            };

            return insert_result;
        };

        public func updateBlock(input : Types.Block) : Result.Result<(Types.PrimaryKey, Types.Block), { #primaryKeyAttrNotFound }> {
            let update_result = Block.objects.update(input);

            switch update_result {
                case (#ok(pk, block)) {
                    _addBlockToBlocksByParentIdIndex(block);
                };
                case (#err(#primaryKeyAttrNotFound)) {
                    return #err(#primaryKeyAttrNotFound);
                };
            };

            return update_result;
        };

        public func deleteBlock(id : Types.PrimaryKey) : () {
            Block.objects.delete(id);
            ignore _removeBlockFromBlocksByParentIdIndex(id);
        };

        public func addPageBlock(
            input : {
                uuid : UUID.UUID;
                parent : ?UUID.UUID;
                content : [UUID.UUID];
                properties : Types.BlockProperties;
            }
        ) : Result.Result<(Types.PrimaryKey, Types.Block), { #keyAlreadyExists }> {
            Block.objects.insert({
                uuid = input.uuid;
                blockType = #page;
                parent = input.parent;
                var content = input.content;
                properties = input.properties;
            });
        };

        public func getBlockByUuid(uuid : UUID.UUID) : Result.Result<Types.Block, { #blockNotFound }> {
            let block = Block.objects.indexFilter(
                "uuid",
                #text(UUID.toText(uuid)),
            ).first();

            switch block {
                case (?block) {
                    return #ok(block);
                };
                case (null) {
                    return #err(#blockNotFound);
                };
            };
        };

        public func getPage(id : Types.PrimaryKey) : Result.Result<Types.Page, { #pageNotFound }> {
            let page = Block.objects.get(id);
            switch page {
                case (?page) {
                    return #ok(page);
                };
                case (null) {
                    return #err(#pageNotFound);
                };
            };
        };

        public func getPageByUuid(uuid : UUID.UUID) : Result.Result<Types.Page, { #pageNotFound }> {
            let page = Block.objects.indexFilter(
                "uuid",
                #text(UUID.toText(uuid)),
            ).first();

            switch page {
                case (?page) {
                    return #ok(page);
                };
                case (null) {
                    return #err(#pageNotFound);
                };
            };
        };

        public func getPages(
            cursor : ?Types.PrimaryKey,
            limit : ?Nat,
            order : ?CoreTypes.SortOrder,
        ) : List.List<Types.Block> {
            var pages = Block.objects.all().filter(
                func block = block.blockType == #page
            );

            func sortBlocksByIdAsc(blockA : Types.Block, blockB : Types.Block) : Order.Order {
                if (blockA.id < blockB.id) { return #less } else {
                    return #greater;
                };
            };

            func sortBlocksByIdDesc(blockA : Types.Block, blockB : Types.Block) : Order.Order {
                if (blockA.id > blockB.id) { return #less } else {
                    return #greater;
                };
            };

            switch (order) {
                case (null) {};
                case (?order) {
                    switch (order.direction) {
                        case (#asc) {
                            pages := pages.orderBy(
                                sortBlocksByIdAsc
                            );
                        };
                        case (#desc) {
                            pages := pages.orderBy(
                                sortBlocksByIdDesc
                            );
                        };
                    };
                };
            };

            switch (cursor) {
                case (null) {};
                case (?cursor) {
                    // Find index of page with id equal to cursor within pages
                    let cursor_index = pages.findIndex<Types.Block>(
                        func hasMatchingId(page : Types.Block) : Bool {
                            return page.id == cursor;
                        }
                    );
                    switch cursor_index {
                        case (null) {};
                        case (?cursor_index) {
                            pages := pages.fromCursor(cursor, func(cursor, page) = page.id == cursor);
                        };
                    };
                };
            };

            switch (limit) {
                case (null) {};
                case (?limit) {
                    pages := pages.limit(limit);
                };
            };

            return pages.value();
        };

        private func _addBlockToBlocksByParentIdIndex(block : Types.Block) {
            let block_parent = switch (block.parent) {
                case (null) {
                    return;
                };
                case (?parent) {
                    parent;
                };
            };

            var current_blocks = blocks_by_parent_uuid.get(UUID.toText(block_parent));
            let typed_current_blocks = switch (current_blocks) {
                case (null) { List.fromArray<Types.PrimaryKey>([]) };
                case (?current_blocks) { current_blocks };
            };
            let updated_blocks = List.append<Types.PrimaryKey>(typed_current_blocks, List.fromArray<Types.PrimaryKey>([block.id]));
            blocks_by_parent_uuid.put(UUID.toText(block_parent), updated_blocks);
        };

        private func _removeBlockFromBlocksByParentIdIndex(block_id : Types.PrimaryKey) : Result.Result<(), { #blockNotFound }> {
            let block = Block.objects.get(block_id);
            switch block {
                case (?block) {
                    let block_parent = switch (block.parent) {
                        case (null) {
                            // Block has no parent, nothing to do
                            return #ok;
                        };
                        case (?parent) {
                            parent;
                        };
                    };
                    var current_blocks = blocks_by_parent_uuid.get(UUID.toText(block_parent));
                    let typed_current_blocks = switch (current_blocks) {
                        case (null) { List.fromArray<Types.PrimaryKey>([]) };
                        case (?current_blocks) { current_blocks };
                    };
                    let updated_blocks = List.filter<Types.PrimaryKey>(typed_current_blocks, func x = x != block.id);
                    blocks_by_parent_uuid.put(UUID.toText(block_parent), updated_blocks);
                    return #ok;
                };
                case (null) {
                    return #err(#blockNotFound);
                };
            };

        };
    };
};
