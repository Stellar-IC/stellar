import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Order "mo:base/Order";
import RBTree "mo:base/RBTree";
import Result "mo:base/Result";
import Stack "mo:base/Stack";
import Text "mo:base/Text";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import ActivitiesTypes "../../../lib/activities/types";
import BlocksModels "../../../lib/blocks/models";
import BlocksTypes "../../../lib/blocks/types";
import EventsTypes "../../../lib/events/types";
import WorkspacesTypes "../../../lib/workspaces/types";

import Models "../../../utils/data/database/models";
import IdManager "../../../utils/data/id_manager";
import Tree "../../../utils/data/lseq/Tree";

import CoreTypes "../../../types";

import Types "../types/v0";

module {
    type Workspace = WorkspacesTypes.Workspace;
    type PrimaryKey = BlocksTypes.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type Block = BlocksTypes.Block;
    type UnsavedBlock = BlocksTypes.UnsavedBlock;
    type BlockContent = BlocksTypes.BlockContent;
    type BlockProperties = BlocksTypes.BlockProperties;
    type BlockEvent = BlocksTypes.BlockEvent;

    type ActivityItem = ActivitiesTypes.ActivityItem;

    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data(
        initial_value : {
            blocks : {
                id : Nat;
                data : RBTree.Tree<PrimaryKey, ShareableBlock>;
            };
            events : RBTree.Tree<Text, BlockEvent>;
        }
    ) {
        public var Block = BlocksModels.Block.Model(initial_value.blocks.id, initial_value.blocks.data);

        public var Event = Models.UUIDModel<BlockEvent>();
        Event.objects.postupgrade(initial_value.events);

        public var Activity = Models.UUIDModel<ActivitiesTypes.Activity>();

        // Red-black trees to index orders by product ID and products by order ID
        public var blocks_by_parent_uuid = RBTree.RBTree<Text, List.List<PrimaryKey>>(Text.compare);

        public func addBlock(input : UnsavedBlock) : Result.Result<(PrimaryKey, Block), { #keyAlreadyExists }> {
            let insert_result = Block.objects.insert(input);

            switch insert_result {
                case (#ok(pk, block)) {
                    addBlockToBlocksByParentIdIndex(block);
                };
                case (#err(#keyAlreadyExists)) {
                    return #err(#keyAlreadyExists);
                };
            };

            return insert_result;
        };

        public func updateBlock(input : Block) : Result.Result<(Types.PrimaryKey, Block), { #primaryKeyAttrNotFound }> {
            let update_result = Block.objects.update(input);

            switch update_result {
                case (#ok(pk, block)) {
                    addBlockToBlocksByParentIdIndex(block);
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

        public func deleteBlockByUuid(uuid : UUID.UUID) : () {
            let block = Block.objects.indexFilter(
                "uuid",
                #text(UUID.toText(uuid)),
            ).first();

            let blockId = switch (block) {
                case (null) {
                    // Block not found, nothing to do
                    return;
                };
                case (?block) {
                    deleteBlock(block.id);
                    block.id;
                };
            };

            ignore _removeBlockFromBlocksByParentIdIndex(blockId);
        };

        public func addPageBlock(
            input : {
                uuid : UUID.UUID;
                parent : ?UUID.UUID;
                properties : BlockProperties;
            }
        ) : Result.Result<(Types.PrimaryKey, Block), { #keyAlreadyExists }> {
            Block.objects.insert({
                uuid = input.uuid;
                var blockType = #page;
                var parent = input.parent;
                content = Tree.Tree(null);
                properties = input.properties;
            });
        };

        public func getBlockByUuid(uuid : UUID.UUID) : Block {
            let block = Block.objects.indexFilter(
                "uuid",
                #text(UUID.toText(uuid)),
            ).first();

            switch block {
                case (?block) {
                    return block;
                };
                case (null) {
                    Debug.trap("Block not found: " # UUID.toText(uuid));
                };
            };
        };

        public func findBlockByUuid(uuid : UUID.UUID) : Result.Result<Block, { #blockNotFound }> {
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

        public func getBlocksByPageUuid(uuid : Text) : List.List<Block> {
            var finalBlocks = List.fromArray<Block>([]);

            func getReversedBlockContent(block : Block) : List.List<Text> {
                List.fromArray(Array.reverse(Tree.toArray(block.content)));
            };

            func sendToFinalBlocks(blockUuid : Text) {
                let blockUuid = stack.peek();
                let block = Block.objects.indexFilter(
                    "uuid",
                    #text(uuid),
                ).first();

                switch block {
                    case (null) {
                        // This shouldn't ever happen
                    };
                    case (?block) {
                        finalBlocks := List.push<Block>(block, finalBlocks);
                    };
                };
            };

            let page = switch (
                Block.objects.indexFilter("uuid", #text(uuid)).first()
            ) {
                case (null) {
                    // Page not found, return empty list
                    return List.fromArray<Block>([]);
                };
                case (?page) { page };
            };

            let pageId = page.id;
            let content = getReversedBlockContent(page);
            let stack : Stack.Stack<Text> = Stack.Stack<Text>();

            for (block in (List.toIter<Text>(content))) {
                stack.push(block);
            };

            var current : ?Text = null;

            while (stack.isEmpty() == false) {
                let blockUuid = stack.pop();

                switch (blockUuid) {
                    case (null) {};
                    case (?blockUuid) {
                        let block = Block.objects.indexFilter(
                            "uuid",
                            #text(blockUuid),
                        ).first();

                        switch block {
                            case (null) {};
                            case (?block) {
                                finalBlocks := List.push<Block>(block, finalBlocks);
                                let nestedBlocks = getReversedBlockContent(block);
                                for (nestedBlock in List.toIter<Text>(nestedBlocks)) {
                                    stack.push(nestedBlock);
                                };
                            };
                        };
                    };
                };
            };

            return finalBlocks;
        };

        public func getPage(id : Types.PrimaryKey) : Result.Result<Block, { #pageNotFound }> {
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

        public func getPageByUuid(uuid : UUID.UUID) : Result.Result<Block, { #pageNotFound }> {
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
        ) : List.List<Block> {
            var pages = Block.objects.all().filter(
                func block = block.blockType == #page
            );

            func sortBlocksByIdAsc(blockA : Block, blockB : Block) : Order.Order {
                if (blockA.id < blockB.id) { return #less } else {
                    return #greater;
                };
            };

            func sortBlocksByIdDesc(blockA : Block, blockB : Block) : Order.Order {
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
                    let cursor_index = pages.findIndex<Block>(
                        func hasMatchingId(page : Block) : Bool {
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

        public func addBlockToBlocksByParentIdIndex(block : Block) {
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

        public func getFirstAncestorPage(block : Block) : ?Block {
            var current_block = block;

            while (true) {
                let parent = switch (current_block.parent) {
                    case (null) { return null };
                    case (?parent) { parent };
                };
                let parent_block = findBlockByUuid(parent);
                switch parent_block {
                    case (#ok(parent_block)) {
                        if (parent_block.blockType == #page) {
                            return ?parent_block;
                        } else {
                            current_block := parent_block;
                        };
                    };
                    case (#err(_)) {
                        return null;
                    };
                };
            };

            return null;
        };

        public func getMostRecentActivityForPage(
            pageId : UUID.UUID
        ) : ?ActivitiesTypes.Activity {
            let page = switch (
                Block.objects.indexFilter(
                    "uuid",
                    #text(UUID.toText(pageId)),
                ).first()
            ) {
                case (?page) { page };
                case (null) { return null };
            };
            let content = page.content;

            return Activity.objects.filter(
                func(activity) {
                    return activity.blockExternalId == pageId or Array.indexOf<Text>(
                        UUID.toText(activity.blockExternalId),
                        Tree.toArray(content),
                        Text.equal,
                    ) != null;
                }
            ).sort(
                func(itemA, itemB) {
                    return Int.compare(itemA.endTime, itemB.endTime);
                }
            ).first();
        };

        public func getActivitiesForPage(
            pageId : UUID.UUID
        ) : List.List<ActivitiesTypes.Activity> {
            let page = switch (
                Block.objects.indexFilter(
                    "uuid",
                    #text(UUID.toText(pageId)),
                ).first()
            ) {
                case (?page) { page };
                case (null) { return null };
            };
            let content = page.content;

            let activities = Activity.objects.filter(
                func(activity) {
                    return activity.blockExternalId == pageId or Array.indexOf<Text>(
                        UUID.toText(activity.blockExternalId),
                        Tree.toArray(content),
                        Text.equal,
                    ) != null;
                }
            ).sort(
                func(itemA, itemB) {
                    return Int.compare(itemA.endTime, itemB.endTime);
                }
            ).value();
        };
    };
};
