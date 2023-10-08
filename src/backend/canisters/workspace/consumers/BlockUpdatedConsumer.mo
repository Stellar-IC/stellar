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
        let currentBlock = _blockByUuid(state, event.data.blockExternalId);

        switch (currentBlock) {
            case (#err(#blockNotFound)) {
                Debug.print("Failed to update block. Block not found with uuid:" # UUID.toText(event.data.blockExternalId));
                return #err(#blockNotFound);
            };
            case (#ok(currentBlock)) {
                // Process transactions
                let transactions = event.data.transactions;
                for (transaction in transactions.vals()) {
                    let title = currentBlock.properties.title;
                    switch (transaction) {
                        case (#insert(transaction)) {
                            switch (title) {
                                case (null) {
                                    Debug.print("Failed to update the block. Title is null");
                                };
                                case (?title) {
                                    ignore title.insert({
                                        identifier = transaction.position;
                                        value = transaction.value;
                                    });
                                };
                            };
                        };
                        case (#delete(transaction)) {
                            switch (title) {
                                case (null) {
                                    Debug.print("Failed to update the block. Title is null");
                                };
                                case (?title) {
                                    title.deleteNode(transaction.position);
                                };
                            };
                        };
                    };
                };

                return #ok(currentBlock);
            };
        };
    };
};
