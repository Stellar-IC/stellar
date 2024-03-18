import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Deque "mo:base/Deque";
import Error "mo:base/Error";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Order "mo:base/Order";
import RBTree "mo:base/RBTree";
import Result "mo:base/Result";
import Stack "mo:base/Stack";
import Text "mo:base/Text";

import UUID "mo:uuid/UUID";

import ActivitiesTypes "../../../lib/activities/types";
import ActivityModule "../../../lib/activities/Activity";
import BlockModule "../../../lib/blocks/Block";
import BlocksTypes "../../../lib/blocks/types";
import EventsTypes "../../../lib/events/types";
import WorkspacesTypes "../../../lib/workspaces/types";

import Models "../../../utils/data/database/models";
import QuerySet "../../../utils/data/database/query_set";
import IdManager "../../../utils/data/id_manager";
import Node "../../../utils/data/lseq/Node";
import Tree "../../../utils/data/lseq/Tree";

import CoreTypes "../../../types";

import Types "../types/v2";

module {
    type Workspace = WorkspacesTypes.Workspace;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type Block = BlocksTypes.Block;
    type BlockContent = BlocksTypes.BlockContent;
    type BlockProperties = BlocksTypes.BlockProperties;
    type BlockEvent = BlocksTypes.BlockEvent;
    type BlockType = BlocksTypes.BlockType;

    public type PaginationOptions = {
        cursor : Nat;
        limit : Nat;
    };

    public class State(_data : Data) {
        public var data = _data;
    };

    public type UpgradeData = {
        blocks : RBTree.Tree<BlocksTypes.PrimaryKey, ShareableBlock>;
        events : RBTree.Tree<BlocksTypes.PrimaryKey, BlockEvent>;
        activities : RBTree.Tree<Nat, ActivitiesTypes.ShareableActivity>;
    };

    public class Data() {
        public var Block = Models.UUIDModel<Block>();
        public var Event = Models.UUIDModel<BlockEvent>();
        public var Activity = Models.IDModel<ActivitiesTypes.Activity>();

        public var blocks_by_parent_uuid = RBTree.RBTree<Text, List.List<BlocksTypes.PrimaryKey>>(Text.compare);

        public func addActivity(input : ActivitiesTypes.Activity) {
            Activity.objects.upsert(input);
        };

        public func addBlock(input : Block) {
            Block.objects.upsert(input);
            addBlockToBlocksByParentIdIndex(input);
        };

        public func updateBlock(input : Block) : Result.Result<(), { #blockNotFound }> {
            switch (findBlock(UUID.toText(input.uuid))) {
                case (null) {
                    return #err(#blockNotFound);
                };
                case (?block) {
                    Block.objects.upsert(input);
                    addBlockToBlocksByParentIdIndex(input);
                };
            };
            #ok;
        };

        public func deleteBlock(uuid : BlocksTypes.PrimaryKey) : () {
            Block.objects.delete(uuid);
            ignore _removeBlockFromBlocksByParentIdIndex(uuid);
        };

        public func findBlock(uuid : BlocksTypes.PrimaryKey) : ?Block {
            let block = Block.objects.get(uuid);

            switch block {
                case (?block) { return ?block };
                case (null) { return null };
            };
        };

        public func getBlock(uuid : BlocksTypes.PrimaryKey) : Block {
            let block = findBlock(uuid);

            switch block {
                case (?block) { return block };
                case (null) { Debug.trap("Block not found: " # uuid) };
            };
        };

        public func getContentForBlock(uuid : BlocksTypes.PrimaryKey, options : PaginationOptions) : List.List<Block> {
            var finalBlocks = List.fromArray<Block>([]);

            func getReversedBlockContent(block : Block) : [BlocksTypes.PrimaryKey] {
                let content = Tree.toPage(block.content, { cursor = options.cursor; limit = options.limit }).items;
                let contentValues = Array.map<Node.Node, BlocksTypes.PrimaryKey>(content, func node = node.value);
                return Array.reverse(contentValues);
            };

            let page = switch (
                Block.objects.get(uuid)
            ) {
                case (null) {
                    // Page not found, return empty list
                    return List.fromArray<Block>([]);
                };
                case (?page) { page };
            };

            let content = getReversedBlockContent(page);
            let stack : Stack.Stack<Text> = Stack.Stack<Text>();

            for (block in (Array.vals(content))) {
                stack.push(block);
            };

            var current : ?Text = null;

            while (stack.isEmpty() == false) {
                let blockUuid = stack.pop();

                switch (blockUuid) {
                    case (null) {};
                    case (?blockUuid) {
                        let block = Block.objects.get(blockUuid);

                        switch block {
                            case (null) {};
                            case (?block) {
                                finalBlocks := List.push<Block>(block, finalBlocks);
                                let nestedBlocks = getReversedBlockContent(block);
                                for (nestedBlock in Array.vals(nestedBlocks)) {
                                    stack.push(nestedBlock);
                                };
                            };
                        };
                    };
                };
            };

            return finalBlocks;
        };

        public func getPages() : List.List<Block> {
            var pages = Block.objects.all().filter(
                func block = block.blockType == #page
            );

            return pages.value();
        };

        public func getFirstAncestorPage(block : Block) : ?Block {
            let MAX_ITERATIONS = 1000;
            var current_block = block;
            var iteration = 0;

            while (true and iteration < MAX_ITERATIONS) {
                iteration := iteration + 1;
                let parent = switch (current_block.parent) {
                    case (null) { return null };
                    case (?parent) { parent };
                };
                let parent_block = findBlock(UUID.toText(parent));

                switch parent_block {
                    case (?parent_block) {
                        if (parent_block.blockType == #page) {
                            return ?parent_block;
                        } else {
                            current_block := parent_block;
                        };
                    };
                    case (null) { return null };
                };
            };

            return null;
        };

        public func getMostRecentActivityForPage(
            uuid : BlocksTypes.PrimaryKey
        ) : ?ActivitiesTypes.Activity {
            let page = switch (findBlock(uuid)) {
                case (?page) { page };
                case (null) { return null };
            };
            let content = page.content;

            func isRelevantActivity(activity : ActivitiesTypes.Activity) : Bool {
                return isActivityOnBlockOrContent(activity, page);
            };

            func compareByEndTime(activityA : ActivitiesTypes.Activity, activityB : ActivitiesTypes.Activity) : Order.Order {
                let result = Int.compare(activityB.endTime, activityA.endTime);
                switch result {
                    case (#equal) { Int.compare(activityB.id, activityA.id) };
                    case (result) { result };
                };
            };

            return Activity.objects.filter(isRelevantActivity).sort(compareByEndTime).first();
        };

        public func getActivitiesForPage(
            uuid : BlocksTypes.PrimaryKey
        ) : List.List<ActivitiesTypes.Activity> {
            let page = switch (findBlock(uuid)) {
                case (?page) { page };
                case (null) { return null };
            };
            let content = page.content;

            func isRelevantActivity(activity : ActivitiesTypes.Activity) : Bool {
                return isActivityOnBlockOrContent(activity, page);
            };

            return Activity.objects.filter(isRelevantActivity).sort(compareActivitiesByEndTimeDesc).value();
        };

        public func preupgrade() : UpgradeData {
            let blocks = RBTree.RBTree<BlocksTypes.PrimaryKey, Block>(Text.compare);
            let shareableBlocks = RBTree.RBTree<BlocksTypes.PrimaryKey, ShareableBlock>(Text.compare);

            blocks.unshare(Block.objects.preupgrade());

            for (block in blocks.entries()) {
                let blockId = block.0;
                let blockData = block.1;
                shareableBlocks.put(blockId, BlockModule.toShareable(blockData));
            };

            let activities = RBTree.RBTree<Nat, ActivitiesTypes.Activity>(Nat.compare);
            let shareableActivities = RBTree.RBTree<Nat, ActivitiesTypes.ShareableActivity>(Nat.compare);

            activities.unshare(Activity.objects.preupgrade());

            for (activity in activities.entries()) {
                let activityId = activity.0;
                let activityData = activity.1;
                shareableActivities.put(activityId, ActivityModule.toShareable(activityData));
            };

            return {
                blocks = shareableBlocks.share();
                events = Event.objects.preupgrade();
                activities = shareableActivities.share();
            };
        };

        public func postupgrade(data : UpgradeData) : () {
            let shareableBlocks = RBTree.RBTree<BlocksTypes.PrimaryKey, ShareableBlock>(Text.compare);

            shareableBlocks.unshare(data.blocks);

            for (block in shareableBlocks.entries()) {
                let blockId = block.0;
                let blockData = block.1;
                let nonShareableBlock = BlockModule.fromShareable(blockData);
                Block.objects.upsert(nonShareableBlock);
                addBlockToBlocksByParentIdIndex(nonShareableBlock);
            };

            let shareableActivities = RBTree.RBTree<Nat, ActivitiesTypes.ShareableActivity>(Nat.compare);
            shareableActivities.unshare(data.activities);

            for (activity in shareableActivities.entries()) {
                let activityId = activity.0;
                let activityData = activity.1;
                let nonShareableactivity = ActivityModule.fromShareable(activityData);
                Activity.objects.upsert(nonShareableactivity);
            };

            Event.objects.postupgrade(data.events);
        };

        func addBlockToBlocksByParentIdIndex(block : Block) {
            let blockId = UUID.toText(block.uuid);
            let block_parent = switch (block.parent) {
                case (null) { return };
                case (?parent) { UUID.toText(parent) };
            };
            let current_blocks = switch (blocks_by_parent_uuid.get(block_parent)) {
                case (null) { List.fromArray<BlocksTypes.PrimaryKey>([]) };
                case (?current_blocks) { current_blocks };
            };
            let updated_blocks = List.append<BlocksTypes.PrimaryKey>(current_blocks, List.fromArray<BlocksTypes.PrimaryKey>([blockId]));
            blocks_by_parent_uuid.put(block_parent, updated_blocks);
        };

        func _removeBlockFromBlocksByParentIdIndex(block_id : BlocksTypes.PrimaryKey) : Result.Result<(), { #blockNotFound }> {
            let block = Block.objects.get(block_id);

            switch block {
                case (?block) {
                    let block_parent = switch (block.parent) {
                        case (null) {
                            // Block has no parent, nothing to do
                            return #ok;
                        };
                        case (?parent) {
                            UUID.toText(parent);
                        };
                    };
                    var current_blocks = blocks_by_parent_uuid.get(block_parent);
                    let typed_current_blocks = switch (current_blocks) {
                        case (null) {
                            List.fromArray<BlocksTypes.PrimaryKey>([]);
                        };
                        case (?current_blocks) { current_blocks };
                    };
                    let updated_blocks = List.filter<BlocksTypes.PrimaryKey>(typed_current_blocks, func x = x != UUID.toText(block.uuid));
                    blocks_by_parent_uuid.put(block_parent, updated_blocks);
                    return #ok;
                };
                case (null) {
                    return #err(#blockNotFound);
                };
            };
        };

        func applyLimit(
            pages : QuerySet.QuerySet<Block>,
            limit : ?Nat,
        ) : QuerySet.QuerySet<Block> {
            switch (limit) {
                case (null) { return pages };
                case (?limit) {
                    return pages.limit(limit);
                };
            };
        };

        func compareActivitiesByEndTimeAsc(activityA : ActivitiesTypes.Activity, activityB : ActivitiesTypes.Activity) : Order.Order {
            return Int.compare(activityA.endTime, activityB.endTime);
        };

        func compareActivitiesByEndTimeDesc(activityA : ActivitiesTypes.Activity, activityB : ActivitiesTypes.Activity) : Order.Order {
            return Int.compare(activityB.endTime, activityA.endTime);
        };

        func isActivityOnBlockOrContent(
            activity : ActivitiesTypes.Activity,
            block : Block,
        ) : Bool {
            let activityBlock = UUID.toText(activity.blockExternalId);
            let inputBlock = UUID.toText(block.uuid);

            func buildContentBlockArray(
                block : Block
            ) : [Text] {
                var currentBlock = block;
                var stack = Deque.empty<Block>();
                var result = List.fromArray<Text>([]);

                stack := Deque.pushFront<Block>(stack, currentBlock);

                label iterateStack while (Deque.isEmpty(stack) == false) {
                    currentBlock := switch (Deque.peekFront(stack)) {
                        case (null) { continue iterateStack };
                        case (?block) { block };
                    };

                    if (
                        List.find(
                            result,
                            func(blockId : Text) : Bool {
                                blockId == UUID.toText(currentBlock.uuid);
                            },
                        ) != null
                    ) {
                        let popResult = switch (Deque.popFront(stack)) {
                            case (null) { continue iterateStack };
                            case (?popResult) { popResult };
                        };
                        stack := popResult.1;

                        continue iterateStack;
                    };

                    result := List.append(result, List.fromArray<Text>([UUID.toText(currentBlock.uuid)]));

                    label iterateContent for (blockId in Tree.toArray(currentBlock.content).vals()) {
                        let block = switch (Block.objects.get(blockId)) {
                            case (null) { continue iterateContent };
                            case (?block) { block };
                        };
                        stack := Deque.pushFront<Block>(stack, block);
                    };
                };

                return List.toArray(result);
            };

            let contentBlocks = buildContentBlockArray(block);

            return activityBlock == inputBlock or Array.indexOf<Text>(
                activityBlock,
                contentBlocks,
                Text.equal,
            ) != null;
        };
    };
};
