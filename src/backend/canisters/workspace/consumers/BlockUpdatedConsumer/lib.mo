import Array "mo:base/Array";
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
import Source "mo:uuid/async/SourceV4";

import Activity "../../../../lib/activities/Activity";
import ActivitiesTypes "../../../../lib/activities/types";
import BlocksModels "../../../../lib/blocks/models";
import BlocksTypes "../../../../lib/blocks/types";
import BlocksUtils "../../../../lib/blocks/utils";
import Tree "../../../../utils/data/lseq/Tree";
import CoreTypes "../../../../types";

import State "../../model/state";
import CreateActivity "../../services/create_activity";
import ExtendActivity "../../services/extend_activity";
import UpdateBlock "../../services/update_block";
import Types "../../types/v0";

import UpdateProperty "./UpdateProperty";

module BlockUpdatedConsumer {
    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Block {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
    ) : async Result.Result<ShareableBlock, { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToUpdate; #anonymousUser }> {
        switch (event.data) {
            case (#updateParent(data)) {
                let blockBeforeEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateParent(state, event, data);
                let blockAfterEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                let pageBlock = state.data.getFirstAncestorPage(blockBeforeEdit);
                let activity = await createOrExtendActivityForEvent(
                    state,
                    pageBlock,
                    event,
                    clonedBlockBeforeEdit,
                    clonedBlockAfterEdit,
                );
                #ok(BlocksModels.Block.toShareable(clonedBlockAfterEdit));
            };
            case (#updateBlockType(data)) {
                let blockBeforeEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateBlockType(state, event, data);
                let blockAfterEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                let pageBlock = state.data.getFirstAncestorPage(blockBeforeEdit);
                let activity = await createOrExtendActivityForEvent(
                    state,
                    pageBlock,
                    event,
                    clonedBlockBeforeEdit,
                    clonedBlockAfterEdit,
                );
                #ok(BlocksModels.Block.toShareable(clonedBlockAfterEdit));
            };
            case (#updateContent(data)) {
                // let blockBeforeEdit = _blockByUuid(state, data.blockExternalId);
                // let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateContent(state, event, data);
                let blockAfterEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                // let pageBlock = state.data.getFirstAncestorPage(blockBeforeEdit);
                // let activity = createOrExtendActivityForEvent(
                //     state,
                //     pageBlock,
                //     event,
                //     blockBeforeEdit,
                //     blockAfterEdit,
                //     deps,
                // );
                #ok(BlocksModels.Block.toShareable(clonedBlockAfterEdit));
            };
            case (#updatePropertyTitle(data)) {
                let blockBeforeEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateTitleProperty(state, event, data);
                let blockAfterEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                let pageBlock = state.data.getFirstAncestorPage(blockBeforeEdit);
                let activity = await createOrExtendActivityForEvent(
                    state,
                    pageBlock,
                    event,
                    clonedBlockBeforeEdit,
                    clonedBlockAfterEdit,
                );
                #ok(BlocksModels.Block.toShareable(clonedBlockAfterEdit));
            };
            case (#updatePropertyChecked(data)) {
                let blockBeforeEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateCheckedProperty(state, event, data);
                let blockAfterEdit = _blockByUuid(state, data.blockExternalId);
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                let pageBlock = state.data.getFirstAncestorPage(blockBeforeEdit);
                let activity = await createOrExtendActivityForEvent(
                    state,
                    pageBlock,
                    event,
                    clonedBlockBeforeEdit,
                    clonedBlockAfterEdit,
                );
                #ok(BlocksModels.Block.toShareable(clonedBlockAfterEdit));
            };
        };
    };

    func createOrExtendActivityForEvent(
        state : State.State,
        pageBlock : ?Block,
        event : BlocksTypes.BlockUpdatedEvent,
        blockBeforeEdit : Block,
        blockAfterEdit : Block,
    ) : async () {
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
                        uuid = await Source.Source().new();
                        edits = [{
                            user = event.user;
                            startTime = event.timestamp;
                            blockValue = {
                                before = ?blockBeforeEdit;
                                after = blockAfterEdit;
                            };
                        }];
                        blockExternalId = blockBeforeEdit.uuid;
                    },
                );
            };
            case (?mostRecentActivity) {
                if (mostRecentActivity.blockExternalId == blockBeforeEdit.uuid) {
                    let updatedActivity = ExtendActivity.execute(
                        state,
                        {
                            activityId = mostRecentActivity.uuid;
                            edits = [{
                                user = event.user;
                                startTime = event.timestamp;
                                blockValue = {
                                    before = ?blockBeforeEdit;
                                    after = blockAfterEdit;
                                };
                            }];
                        },
                    );
                    state.data.Activity.objects.upsert(updatedActivity);
                } else {
                    let activity = CreateActivity.execute(
                        state,
                        {
                            uuid = await Source.Source().new();
                            edits = [{
                                user = event.user;
                                startTime = event.timestamp;
                                blockValue = {
                                    before = ?blockBeforeEdit;
                                    after = blockAfterEdit;
                                };
                            }];
                            blockExternalId = blockBeforeEdit.uuid;
                        },
                    );
                };
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
