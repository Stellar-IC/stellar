import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Stack "mo:base/Stack";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import Activity "../../../../lib/activities/Activity";
import ActivitiesTypes "../../../../lib/activities/types";
import BlockModule "../../../../lib/blocks/Block";
import BlocksTypes "../../../../lib/blocks/types";
import BlocksUtils "../../../../lib/blocks/utils";
import Tree "../../../../utils/data/lseq/Tree";
import CoreTypes "../../../../types";

import CreateActivity "../../services/create_activity";
import ExtendActivity "../../services/extend_activity";
import State "../../state";
import Types "../../types/v0";

import UpdateProperty "./UpdateProperty";

module BlockUpdatedConsumer {
    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : ?Block {
        state.data.findBlock(UUID.toText(uuid));
    };

    public func execute(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        idForNewActivity : Nat,
    ) : Result.Result<ShareableBlock, { #blockNotFound; #insufficientCycles; #inputTooLong; #invalidBlockType; #failedToUpdate; #anonymousUser }> {
        switch (event.data) {
            case (#updateParent(data)) {
                let blockBeforeEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateParent(state, event, data, blockBeforeEdit);
                let blockAfterEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                // let firstAncestorPage = state.data.getFirstAncestorPage(blockBeforeEdit);
                // let activity = createOrExtendActivityForEvent(
                //     state,
                //     firstAncestorPage,
                //     event,
                //     clonedBlockBeforeEdit,
                //     clonedBlockAfterEdit,
                //     idForNewActivity,
                // );
                #ok(BlockModule.toShareable(clonedBlockAfterEdit));
            };
            case (#updateBlockType(data)) {
                let blockBeforeEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateBlockType(state, event, data, blockBeforeEdit);
                let blockAfterEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                let firstAncestorPage = state.data.getFirstAncestorPage(blockBeforeEdit);
                let activity = createOrExtendActivityForEvent(
                    state,
                    firstAncestorPage,
                    event,
                    clonedBlockBeforeEdit,
                    clonedBlockAfterEdit,
                    idForNewActivity,
                );
                #ok(BlockModule.toShareable(clonedBlockAfterEdit));
            };
            case (#updateContent(data)) {
                let blockBeforeEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                // let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateContent(state, event, data, blockBeforeEdit);
                let blockAfterEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                // let firstAncestorPage = state.data.getFirstAncestorPage(blockBeforeEdit);
                // let activity = createOrExtendActivityForEvent(
                //     state,
                //     firstAncestorPage,
                //     event,
                //     blockBeforeEdit,
                //     blockAfterEdit,
                //     deps,
                // );
                #ok(BlockModule.toShareable(clonedBlockAfterEdit));
            };
            case (#updatePropertyTitle(data)) {
                let blockBeforeEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                // let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateTitleProperty(state, event, data, blockBeforeEdit);
                // let blockAfterEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                //     case (?block) { block };
                //     case (null) { return #err(#blockNotFound) };
                // };
                // let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                // let firstAncestorPage = state.data.getFirstAncestorPage(blockBeforeEdit);
                // let activity = createOrExtendActivityForEvent(
                //     state,
                //     firstAncestorPage,
                //     event,
                //     clonedBlockBeforeEdit,
                //     clonedBlockAfterEdit,
                //     idForNewActivity,
                // );
                #ok(BlockModule.toShareable(blockBeforeEdit));
            };
            case (#updatePropertyChecked(data)) {
                let blockBeforeEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockBeforeEdit = BlocksUtils.clone(blockBeforeEdit);
                let result = updateCheckedProperty(state, event, data, blockBeforeEdit);
                let blockAfterEdit = switch (_blockByUuid(state, data.blockExternalId)) {
                    case (?block) { block };
                    case (null) { return #err(#blockNotFound) };
                };
                let clonedBlockAfterEdit = BlocksUtils.clone(blockAfterEdit);
                let firstAncestorPage = state.data.getFirstAncestorPage(blockBeforeEdit);
                let activity = createOrExtendActivityForEvent(
                    state,
                    firstAncestorPage,
                    event,
                    clonedBlockBeforeEdit,
                    clonedBlockAfterEdit,
                    idForNewActivity,
                );
                #ok(BlockModule.toShareable(clonedBlockAfterEdit));
            };
        };
    };

    func createOrExtendActivityForEvent(
        state : State.State,
        firstAncestorPage : ?Block,
        event : BlocksTypes.BlockUpdatedEvent,
        blockBeforeEdit : Block,
        blockAfterEdit : Block,
        idForNewActivity : Nat,
    ) : () {
        let mostRecentActivity : ?ActivitiesTypes.Activity = switch (firstAncestorPage) {
            case (?firstAncestorPage) {
                state.data.getMostRecentActivityForPage(UUID.toText(firstAncestorPage.uuid));
            };
            case (null) {
                // If there is no ancestor page, then the block is a page.
                state.data.getMostRecentActivityForPage(UUID.toText(blockBeforeEdit.uuid));
            };
        };

        switch (mostRecentActivity) {
            case (null) {
                let activity = CreateActivity.execute(
                    state,
                    {
                        id = idForNewActivity;
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
                            activityId = mostRecentActivity.id;
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
                            id = idForNewActivity;
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
        block : Block,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        block.blockType := data.blockType;
        return block;
    };

    func updateContent(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockContentUpdatedEventData,
        block : Block,
    ) : Result.Result<Block, { #failedToUpdate }> {
        let blockExternalId = data.blockExternalId;

        for (event in Array.vals(data.transaction)) {
            switch (event) {
                case (#insert(event)) {
                    let result = block.content.insert({
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
                    block.content.deleteNode(
                        event.position
                    );
                };
            };
        };

        return #ok(block);
    };

    func updateParent(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockParentUpdatedEventData,
        block : Block,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        block.parent := ?data.parentBlockExternalId;
        return block;
    };

    func updateTitleProperty(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockPropertyTitleUpdatedEventData,
        block : Block,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        UpdateProperty.execute({ event with data = #title(data) }, block);
        return block;
    };

    func updateCheckedProperty(
        state : State.State,
        event : BlocksTypes.BlockUpdatedEvent,
        data : BlocksTypes.BlockPropertyCheckedUpdatedEventData,
        block : Block,
    ) : Block {
        let blockExternalId = data.blockExternalId;
        UpdateProperty.execute({ event with data = #checked(data) }, block);
        return block;
    };
};
