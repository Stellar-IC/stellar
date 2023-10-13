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
import Text "mo:base/Text";
import Char "mo:base/Char";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat32 "mo:base/Nat32";
import Stack "mo:base/Stack";

import BlocksTypes "../../../lib/blocks/types";
import Tree "../../../utils/data/lseq/Tree";

module BlockUpdatedConsumer {
    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<BlocksTypes.Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlocksTypes.BlockUpdatedEvent, state : State.State) : Result.Result<BlocksTypes.Block, { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToUpdate; #anonymousUser }> {
        switch (event) {
            case (#updateBlockType(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = _blockByUuid(state, blockExternalId);

                switch (currentBlock) {
                    case (#err(#blockNotFound)) {
                        Debug.print("Failed to update block. Block not found with uuid:" # UUID.toText(blockExternalId));
                        return #err(#blockNotFound);
                    };
                    case (#ok(currentBlock)) {
                        currentBlock.blockType := event.data.blockType;
                        return #ok(currentBlock);
                    };
                };
            };
            case (#updatePropertyTitle(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = _blockByUuid(state, blockExternalId);

                switch (currentBlock) {
                    case (#err(#blockNotFound)) {
                        Debug.print("Failed to update block. Block not found with uuid:" # UUID.toText(blockExternalId));
                        return #err(#blockNotFound);
                    };
                    case (#ok(currentBlock)) {
                        let title = currentBlock.properties.title;
                        switch (event.data.event) {
                            case (#insert(treeEvent)) {
                                switch (title) {
                                    case (null) {
                                        Debug.print("Failed to update the block. Title is null");
                                    };
                                    case (?title) {
                                        ignore title.insert({
                                            identifier = treeEvent.position;
                                            value = treeEvent.value;
                                        });
                                    };
                                };
                                return #ok(currentBlock);
                            };
                            case (#delete(treeEvent)) {
                                switch (title) {
                                    case (null) {
                                        Debug.print("Failed to update the block. Title is null");
                                    };
                                    case (?title) {
                                        title.deleteNode(treeEvent.position);
                                    };
                                };
                                return #ok(currentBlock);
                            };
                        };
                    };
                };
            };
        };
    };
};
