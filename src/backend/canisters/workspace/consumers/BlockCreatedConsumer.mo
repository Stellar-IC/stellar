import CreateBlock "../services/create_block";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

import BlocksTypes "../../../lib/blocks/types";
import UpdateBlock "../services/update_block";
import Tree "../../../utils/data/lseq/Tree";

import State "../model/state";
import Types "../types/v0";

module BlockCreatedConsumer {
    type Block = BlocksTypes.Block;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlocksTypes.BlockCreatedEvent, state : State.State) : () {
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
            case (#err(#anonymousUser)) {
                return ();
            };
            case (#err(#failedToCreate)) {
                return ();
            };
            case (#err(#inputTooLong)) {
                return ();
            };
            case (#err(#insufficientCycles)) {
                return ();
            };
            case (#err(#invalidBlockType)) {
                return ();
            };
            case (#ok(block)) {
                block;
            };
        };

        let parentBlock = switch (event.data.block.parent) {
            case (null) {
                return ();
            };
            case (?parent) {
                let parentBlock = _blockByUuid(state, parent);

                switch (parentBlock) {
                    case (#err(#blockNotFound)) {
                        return ();
                    };
                    case (#ok(parentBlock)) {
                        parentBlock;
                    };
                };
            };
        };

    };
};
