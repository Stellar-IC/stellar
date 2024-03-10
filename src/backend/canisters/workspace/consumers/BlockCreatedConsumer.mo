import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import Activity "../../../lib/activities/Activity";
import ActivityBuilder "../../../lib/activities/ActivityBuilder";
import ActivitiesTypes "../../../lib/activities/types";
import BlocksTypes "../../../lib/blocks/types";
import BlocksUtils "../../../lib/blocks/utils";
import Tree "../../../utils/data/lseq/Tree";
import CoreTypes "../../../types";

import State "../model/state";
import CreateActivity "../services/create_activity";
import CreateBlock "../services/create_block";
import UpdateBlock "../services/update_block";
import Types "../types/v0";

module BlockCreatedConsumer {
    type Block = BlocksTypes.Block;

    public func execute(
        state : State.State,
        event : BlocksTypes.BlockCreatedEvent,
    ) : async Result.Result<ActivitiesTypes.ShareableActivity, { #anonymousUser; #failedToCreate; #inputTooLong; #insufficientCycles; #invalidBlockType }> {
        let result = CreateBlock.execute(
            state,
            event.user,
            {
                uuid = event.data.block.uuid;
                var blockType = event.data.block.blockType;
                content = Tree.Tree(null);
                var parent = event.data.block.parent;
                properties = {
                    title = ?Tree.Tree(null);
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
                uuid = await Source.Source().new();
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
