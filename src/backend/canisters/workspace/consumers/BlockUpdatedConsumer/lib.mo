import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Stack "mo:base/Stack";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";

import State "../../model/state";
import UpdateBlock "../../services/update_block";
import Types "../../types";

import BlocksTypes "../../../../lib/blocks/types";
import Tree "../../../../utils/data/lseq/Tree";

import UpdateProperty "./UpdateProperty";

module BlockUpdatedConsumer {
    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<BlocksTypes.Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlocksTypes.BlockUpdatedEvent, state : State.State) : Result.Result<BlocksTypes.Block, { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToUpdate; #anonymousUser }> {
        let blockExternalId = switch (event) {
            case (#updateBlockType(event)) { event.data.blockExternalId };
            case (#updatePropertyTitle(event)) { event.data.blockExternalId };
            case (#updatePropertyChecked(event)) { event.data.blockExternalId };
        };

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
                        UpdateProperty.execute(#title(event), currentBlock);
                        return #ok(currentBlock);
                    };
                };
            };
            case (#updatePropertyChecked(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = _blockByUuid(state, blockExternalId);

                switch (currentBlock) {
                    case (#err(#blockNotFound)) {
                        Debug.print("Failed to update block. Block not found with uuid:" # UUID.toText(blockExternalId));
                        return #err(#blockNotFound);
                    };
                    case (#ok(currentBlock)) {
                        UpdateProperty.execute(#checked(event), currentBlock);
                        return #ok(currentBlock);

                    };
                };
            };
        };
    };
};
