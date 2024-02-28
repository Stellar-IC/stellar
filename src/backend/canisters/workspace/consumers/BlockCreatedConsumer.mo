import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";

import ActivityBuilder "../../../lib/activities/ActivityBuilder";
import BlocksTypes "../../../lib/blocks/types";
import UUIDGenerator "../../../lib/shared/UUIDGenerator";
import Tree "../../../utils/data/lseq/Tree";

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
        deps : { uuidGenerator : UUIDGenerator.UUIDGenerator },
    ) : () {
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
            // TODO: Handle errors
            case (#err(_)) { return () };
            case (#ok(block)) { block };
        };

        let activity = CreateActivity.execute(
            state,
            {
                edits = [{
                    blockValue = {
                        before = null;
                        after = block;
                    };
                    startTime = event.timestamp;
                }];
                blockExternalId = block.uuid;
            },
            { uuidGenerator = deps.uuidGenerator },
        );

        ();
    };
};
