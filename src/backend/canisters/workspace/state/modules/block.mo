import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Deque "mo:base/Deque";
import Error "mo:base/Error";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Order "mo:base/Order";
import RBTree "mo:base/RBTree";
import Result "mo:base/Result";
import Stack "mo:base/Stack";
import Text "mo:base/Text";

import Map "mo:map/Map";

import UUID "mo:uuid/UUID";

import ActivitiesTypes "../../../../lib/activities/Types";
import ActivityModule "../../../../lib/activities/Activity";
import BlockModule "../../../../lib/blocks/Block";
import BlocksTypes "../../../../lib/blocks/Types";
import EventsTypes "../../../../lib/events/Types";

import QuerySet "../../../../utils/data/database/query_set";
import Node "../../../../utils/data/lseq/Node";
import Tree "../../../../utils/data/lseq/Tree";

import CoreTypes "../../../../types";

import Types "../../types/v2";
import S "../state";

module {
    type Result<Ok, Err> = Result.Result<Ok, Err>;
    type BlockMap = Map.Map<Text, ShareableBlock>;

    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type PaginationOptions = {
        cursor : Nat;
        limit : Nat;
    };

    type ActivityId = ActivitiesTypes.ActivityId;
    type Activity = ActivitiesTypes.Activity;
    type ShareableActivity = ActivitiesTypes.ShareableActivity;

    let fromShareable = BlockModule.fromShareable;

    public func addBlock(state : S.State, input : Block) : Result<Block, { #failed }> {
        let result = Map.put<Text, ShareableBlock>(
            state.data.blocks,
            (Text.hash, Text.equal),
            UUID.toText(input.uuid),
            BlockModule.toShareable(input),
        );

        switch (result) {
            case (null) { return #err(#failed) };
            case (?block) { return #ok(fromShareable(block)) };
        };
    };

    public func addActivity(state : S.State, input : Activity) : Result<Activity, { #failed }> {
        let result = Map.put<ActivityId, ShareableActivity>(
            state.data.activities,
            (Nat32.fromNat, Nat.equal),
            input.id,
            ActivityModule.toShareable(input),
        );

        switch (result) {
            case (null) { return #err(#failed) };
            case (?activity) {
                return #ok(ActivityModule.fromShareable(activity));
            };
        };
    };

    public func updateActivity(state : S.State, input : Activity) : Result<Activity, { #failed }> {
        let result = Map.put<ActivityId, ShareableActivity>(
            state.data.activities,
            (Nat32.fromNat, Nat.equal),
            input.id,
            ActivityModule.toShareable(input),
        );

        switch (result) {
            case (null) { return #err(#failed) };
            case (?activity) {
                return #ok(ActivityModule.fromShareable(activity));
            };
        };
    };

    public func updateBlock(state : S.State, input : Block) : Result<Block, { #failed }> {
        let result = Map.put<Text, ShareableBlock>(
            state.data.blocks,
            (Text.hash, Text.equal),
            UUID.toText(input.uuid),
            BlockModule.toShareable(input),
        );

        switch (result) {
            case (null) { return #err(#failed) };
            case (?block) { return #ok(fromShareable(block)) };
        };
    };

    public func deleteBlock(state : S.State, uuid : Text) : () {
        Map.delete<Text, ShareableBlock>(
            state.data.blocks,
            (Text.hash, Text.equal),
            uuid,
        );
    };

    public func findBlock(state : S.State, uuid : Text) : ?Block {
        let result = Map.get<Text, ShareableBlock>(
            state.data.blocks,
            (Text.hash, Text.equal),
            uuid,
        );

        switch result {
            case (null) { return null };
            case (?block) { return ?fromShareable(block) };
        };
    };

    public func getBlock(state : S.State, uuid : Text) : Block {
        let block = findBlock(state, uuid);

        switch block {
            case (?block) { return block };
            case (null) { Debug.trap("Block not found: " # uuid) };
        };
    };

    public func findActivity(state : S.State, id : ActivityId) : ?Activity {
        let result = Map.get<ActivitiesTypes.ActivityId, ShareableActivity>(
            state.data.activities,
            (Nat32.fromNat, Nat.equal),
            id,
        );

        switch result {
            case (null) { return null };
            case (?activity) { return ?ActivityModule.fromShareable(activity) };
        };
    };

    public func getActivity(state : S.State, id : ActivityId) : Activity {
        let activity = findActivity(state, id);

        switch activity {
            case (?activity) { return activity };
            case (null) { Debug.trap("Activity not found: " # debug_show id) };
        };
    };

    public func getContentForBlock(state : S.State, uuid : BlocksTypes.PrimaryKey, options : PaginationOptions) : List.List<Block> {
        var finalBlocks = List.fromArray<Block>([]);

        func getReversedBlockContent(block : Block) : [BlocksTypes.PrimaryKey] {
            let content = Tree.toPage(block.content, { cursor = options.cursor; limit = options.limit }).items;
            let contentValues = Array.map<Node.Node, BlocksTypes.PrimaryKey>(content, func node = node.value);
            return Array.reverse(contentValues);
        };

        let page = switch (findBlock(state, uuid)) {
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
                    let block = findBlock(state, blockUuid);

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

    public func getPages(state : S.State) : List.List<ShareableBlock> {
        var pages = Map.toArrayMap<Text, ShareableBlock, ShareableBlock>(
            state.data.blocks,
            func((key : Text, value : ShareableBlock)) {
                ?value;
            },
        );

        return List.fromArray(pages);
    };

    public func getFirstAncestorPage(state : S.State, block : Block) : ?Block {
        let MAX_ITERATIONS = 1000;
        var current_block = block;
        var iteration = 0;

        while (true and iteration < MAX_ITERATIONS) {
            iteration := iteration + 1;
            let parent = switch (current_block.parent) {
                case (null) { return null };
                case (?parent) { parent };
            };
            let parent_block = findBlock(state, UUID.toText(parent));

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

    func isActivityOnBlockOrContent(
        state : S.State,
        activity : ActivitiesTypes.ShareableActivity,
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
                    let block = switch (findBlock(state, blockId)) {
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

    public func iterateBlockDescendants(state : S.State, block : Block, callback : (Block) -> ()) {
        var currentBlock = block;
        var stack = Deque.empty<Block>();

        stack := Deque.pushFront<Block>(stack, currentBlock);

        label iterateStack while (Deque.isEmpty(stack) == false) {
            currentBlock := switch (Deque.popFront(stack)) {
                case (null) { continue iterateStack };
                case (?(block, updated)) {
                    stack := updated;
                    block;
                };
            };
            callback(currentBlock);

            label iterateContent for (blockId in Tree.toArray(currentBlock.content).vals()) {
                let block = switch (findBlock(state, blockId)) {
                    case (null) { continue iterateContent };
                    case (?block) { block };
                };
                stack := Deque.pushFront<Block>(stack, block);
            };
        };
    };

    public func getActivitiesForPage(
        state : S.State,
        uuid : BlocksTypes.PrimaryKey,
    ) : List.List<ActivitiesTypes.ShareableActivity> {
        let page = switch (findBlock(state, uuid)) {
            case (?page) { page };
            case (null) { return null };
        };
        let content = page.content;

        func isRelevantActivity(activityId : ActivitiesTypes.ActivityId, activity : ActivitiesTypes.ShareableActivity) : Bool {
            return isActivityOnBlockOrContent(state, activity, page);
        };

        func compareActivitiesByEndTimeDesc(activityA : ActivitiesTypes.ShareableActivity, activityB : ActivitiesTypes.ShareableActivity) : Order.Order {
            return Int.compare(activityB.endTime, activityA.endTime);
        };

        let relevantActivities = Map.toArrayMap<ActivitiesTypes.ActivityId, ActivitiesTypes.ShareableActivity, ActivitiesTypes.ShareableActivity>(
            Map.filter<ActivitiesTypes.ActivityId, ActivitiesTypes.ShareableActivity>(
                state.data.activities,
                (Nat32.fromNat, Nat.equal),
                isRelevantActivity,
            ),
            func((key : Nat, value : ActivitiesTypes.ShareableActivity)) {
                ?value;
            },
        );

        let querySet = QuerySet.QuerySet(?relevantActivities);

        return QuerySet.QuerySet<ActivitiesTypes.ShareableActivity>(?relevantActivities).sort(compareActivitiesByEndTimeDesc).value();
    };

    public func getMostRecentActivityForPage(
        state : S.State,
        uuid : BlocksTypes.PrimaryKey,
    ) : ?ActivitiesTypes.Activity {
        let page = switch (findBlock(state, uuid)) {
            case (?page) { page };
            case (null) { return null };
        };
        let content = page.content;

        func isRelevantActivity(activityId : ActivitiesTypes.ActivityId, activity : ActivitiesTypes.ShareableActivity) : Bool {
            return isActivityOnBlockOrContent(state, activity, page);
        };

        func compareByEndTime(activityA : ActivitiesTypes.ShareableActivity, activityB : ActivitiesTypes.ShareableActivity) : Order.Order {
            let result = Int.compare(activityB.endTime, activityA.endTime);
            switch result {
                case (#equal) { Int.compare(activityB.id, activityA.id) };
                case (result) { result };
            };
        };

        let relevantActivities = Map.toArrayMap<ActivitiesTypes.ActivityId, ActivitiesTypes.ShareableActivity, ActivitiesTypes.ShareableActivity>(
            Map.filter<ActivitiesTypes.ActivityId, ActivitiesTypes.ShareableActivity>(
                state.data.activities,
                (Nat32.fromNat, Nat.equal),
                isRelevantActivity,
            ),
            func((key : Nat, value : ActivitiesTypes.ShareableActivity)) {
                ?value;
            },
        );

        let querySet = QuerySet.QuerySet(?relevantActivities);
        let activity = querySet.sort(compareByEndTime).first();

        switch (activity) {
            case (null) { null };
            case (?activity) { ?ActivityModule.fromShareable(activity) };
        };
    };
};
