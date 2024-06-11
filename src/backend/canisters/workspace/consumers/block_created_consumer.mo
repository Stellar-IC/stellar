import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import Activity "../../../lib/activities/activity";
import ActivityBuilder "../../../lib/activities/activity_builder";
import ActivitiesTypes "../../../lib/activities/types";
import BlocksTypes "../../../lib/blocks/types";
import BlocksUtils "../../../lib/blocks/utils";
import Tree "../../../utils/data/lseq/Tree";
import CoreTypes "../../../types";

import CreateActivity "../services/create_activity";
import CreateBlock "../services/create_block";
import State "../state";

module BlockCreatedConsumer {
    type Block = BlocksTypes.Block;

    public func execute(
        state : State.State,
        event : BlocksTypes.BlockCreatedEvent,
        activityId : Nat,
    ) : Result.Result<ActivitiesTypes.ShareableActivity, { #anonymousUser; #failedToCreate; #inputTooLong; #insufficientCycles; #invalidBlockType }> {
        let result = CreateBlock.execute(
            state,
            event.user,
            {
                uuid = event.data.block.uuid;
                var blockType = event.data.block.blockType;
                content = Tree.Tree(null);
                var parent = event.data.block.parent;
                properties = {
                    var title = ?Tree.Tree(null);
                    var checked = ?false;
                };
            },
        );

        let block = switch (result) {
            case (#err(err)) { return #err(err) };
            case (#ok(block)) { BlocksUtils.clone(block) };
        };

        let activity = CreateActivity.execute(
            state,
            {
                id = activityId;
                edits = [{
                    user = event.user;
                    blockValue = {
                        before = null;
                        after = block;
                    };
                    startTime = event.timestamp;
                }];
                blockExternalId = block.uuid;
            },
        );

        return #ok(Activity.toShareable(activity));
    };
};
