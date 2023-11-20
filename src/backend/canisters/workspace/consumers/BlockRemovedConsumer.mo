import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../../lib/blocks/types";

import State "../model/state";
import UpdateBlock "../services/update_block";
import Types "../types";
import Tree "../../../utils/data/lseq/Tree";

module BlockRemovedConsumer {
    type Block = BlocksTypes.Block_v2;
    type BlockRemovedEvent = BlocksTypes.BlockRemovedEvent;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlockRemovedEvent, state : State.State) : Result.Result<(), { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToRemove; #anonymousUser }> {
        let parentBlock = _blockByUuid(state, event.data.block.parent);

        switch (parentBlock) {
            case (#err(#blockNotFound)) {
                Debug.print("Failed to remove block. Block not found with uuid:" # UUID.toText(event.data.block.uuid));
                return #err(#blockNotFound);
            };
            case (#ok(parentBlock)) {
                let nodeToRemove = Tree.getNodeAtPosition(parentBlock.content, event.data.index);
                parentBlock.content.delete(nodeToRemove.identifier);
                return #ok();
            };
        };
    };
};
