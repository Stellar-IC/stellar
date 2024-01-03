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

import UpdateParent "./UpdateParent";
import UpdateProperty "./UpdateProperty";

module BlockUpdatedConsumer {
    type Block = BlocksTypes.Block;
    type Block_v2 = BlocksTypes.Block_v2;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<Block_v2, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlocksTypes.BlockUpdatedEvent, state : State.State) : Result.Result<Block_v2, { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToUpdate; #anonymousUser }> {
        switch (event) {
            case (#updateParent(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = _blockByUuid(state, blockExternalId);

                switch (currentBlock) {
                    case (#err(#blockNotFound)) {
                        return #err(#blockNotFound);
                    };
                    case (#ok(currentBlock)) {
                        UpdateParent.execute(event, currentBlock);
                        return #ok(currentBlock);
                    };
                };
            };
            case (#updateBlockType(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = _blockByUuid(state, blockExternalId);

                switch (currentBlock) {
                    case (#err(#blockNotFound)) {
                        return #err(#blockNotFound);
                    };
                    case (#ok(currentBlock)) {
                        currentBlock.blockType := event.data.blockType;
                        return #ok(currentBlock);
                    };
                };
            };
            case (#updateContent(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = switch (_blockByUuid(state, blockExternalId)) {
                    case (#err(#blockNotFound)) {
                        return #err(#blockNotFound);
                    };
                    case (#ok(block)) { block };
                };

                for (event in Array.vals(event.data.transaction)) {
                    switch (event) {
                        case (#insert(event)) {
                            let res = currentBlock.content.insert({
                                identifier = event.position;
                                value = event.value;
                            });
                            switch (res) {
                                case (#err(#identifierAlreadyInUse)) {
                                    return #err(#failedToUpdate);
                                };
                                case (#err(#invalidIdentifier)) {
                                    return #err(#failedToUpdate);
                                };
                                case (#err(#outOfOrder)) {
                                    return #err(#failedToUpdate);
                                };
                                case (#ok) {};
                            };
                        };
                        case (#delete(event)) {
                            currentBlock.content.deleteNode(
                                event.position
                            );
                        };
                    };
                };

                return #ok(currentBlock);
            };
            case (#updatePropertyTitle(event)) {
                let blockExternalId = event.data.blockExternalId;
                let currentBlock = _blockByUuid(state, blockExternalId);

                switch (currentBlock) {
                    case (#err(#blockNotFound)) {
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
