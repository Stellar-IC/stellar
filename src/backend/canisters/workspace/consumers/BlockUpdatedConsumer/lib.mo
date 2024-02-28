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

import ActivitiesTypes "../../../../lib/activities/types";
import BlocksTypes "../../../../lib/blocks/types";
import UUIDGenerator "../../../../lib/shared/UUIDGenerator";
import Tree "../../../../utils/data/lseq/Tree";

import State "../../model/state";
import CreateActivity "../../services/create_activity";
import ExtendActivity "../../services/extend_activity";
import UpdateBlock "../../services/update_block";
import Types "../../types/v0";

import UpdateProperty "./UpdateProperty";

module BlockUpdatedConsumer {
    type Block = BlocksTypes.Block;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Block {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        deps : { uuidGenerator : UUIDGenerator.UUIDGenerator },
    ) : Result.Result<Block, { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToUpdate; #anonymousUser }> {
        switch (event.data) {
            case (#updateParent(data)) {
                let blockBeforeEdit = _blockByUuid(state, data.blockExternalId);
                let result = updateParent(state, event, data);
                let blockAfterEdit = _blockByUuid(state, data.blockExternalId);
                let pageBlock = state.data.getFirstAncestorPage(blockBeforeEdit);
                let mostRecentActivity : ?ActivitiesTypes.Activity = switch (pageBlock) {
                    case (?pageBlock) {
                        state.data.getMostRecentActivityForPage(pageBlock.uuid);
                    };
                    case (null) { null };
                };

                switch (mostRecentActivity) {
                    case (null) {
                        let activity = CreateActivity.execute(
                            state,
                            {
                                edits = [{
                                    startTime = event.timestamp;
                                    blockValue = {
                                        before = ?blockBeforeEdit;
                                        after = blockAfterEdit;
                                    };
                                }];
                                blockExternalId = blockBeforeEdit.uuid;
                            },
                            { uuidGenerator = deps.uuidGenerator },
                        );
                    };
                    case (?mostRecentActivity) {
                        if (mostRecentActivity.blockExternalId == blockBeforeEdit.uuid) {
                            let updatedActivity = ExtendActivity.execute(
                                state,
                                {
                                    activityId = mostRecentActivity.uuid;
                                    edits = [{
                                        startTime = event.timestamp;
                                        blockValue = {
                                            before = ?blockBeforeEdit;
                                            after = blockAfterEdit;
                                        };
                                    }];
                                },
                            );
                            state.data.Activity.objects.upsert(updatedActivity);
                        };
                    };
                };

                #ok(blockAfterEdit);
            };
            case (#updateBlockType(data)) {
                #ok(updateBlockType(state, event, data));
            };
            case (#updateContent(data)) {
                updateContent(state, event, data);
            };
            case (#updatePropertyTitle(data)) {
                #ok(updateTitleProperty(state, event, data));
            };
            case (#updatePropertyChecked(data)) {
                #ok(updateCheckedProperty(state, event, data));
            };
        };
    };

    func updateBlockType(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockBlockTypeUpdatedEventData,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        let currentBlock = _blockByUuid(state, blockExternalId);
        currentBlock.blockType := data.blockType;
        return currentBlock;
    };

    func updateContent(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockContentUpdatedEventData,
    ) : Result.Result<Block, { #failedToUpdate }> {
        let blockExternalId = data.blockExternalId;
        let currentBlock = _blockByUuid(state, blockExternalId);

        for (event in Array.vals(data.transaction)) {
            switch (event) {
                case (#insert(event)) {
                    let result = currentBlock.content.insert({
                        identifier = event.position;
                        value = event.value;
                    });
                    switch (result) {
                        case (#ok) {};
                        case (#err(_)) {
                            return #err(#failedToUpdate);
                        };
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

    func updateParent(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockParentUpdatedEventData,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        let currentBlock = _blockByUuid(state, blockExternalId);
        currentBlock.parent := ?data.parentBlockExternalId;
        return currentBlock;
    };

    func updateTitleProperty(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockPropertyTitleUpdatedEventData,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        let currentBlock = _blockByUuid(state, blockExternalId);
        UpdateProperty.execute({ event with data = #title(data) }, currentBlock);
        return currentBlock;
    };

    func updateCheckedProperty(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockPropertyCheckedUpdatedEventData,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        let currentBlock = _blockByUuid(state, blockExternalId);
        UpdateProperty.execute({ event with data = #checked(data) }, currentBlock);
        return currentBlock;
    };
};
