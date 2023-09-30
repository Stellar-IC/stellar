import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Types "../types";
import State "../model/state";
import UpdateBlock "../services/update_block";

module BlockRemovedConsumer {
    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<Types.Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : Types.BlockRemovedEvent, state : State.State) : Result.Result<(), { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToRemove; #anonymousUser }> {
        let parentBlock = _blockByUuid(state, event.data.parent);

        switch (parentBlock) {
            case (#err(#blockNotFound)) {
                Debug.print("Failed to remove block. Block not found with uuid:" # UUID.toText(event.data.blockExternalId));
                return #err(#blockNotFound);
            };
            case (#ok(parentBlock)) {
                let newContent = Array.filter<UUID.UUID>(parentBlock.content, func x = x != event.data.blockExternalId);
                parentBlock.content := newContent;
                return #ok();
            };
        };
    };
};
