import CreateBlock "../services/create_block";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Types "../types";
import State "../model/state";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

import BlocksTypes "../../../lib/blocks/types";
import UpdateBlock "../services/update_block";
import Tree "../../../utils/data/lseq/Tree";

module BlockCreatedConsumer {
    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<BlocksTypes.Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlocksTypes.BlockCreatedEvent, state : State.State) : () {
        let result = CreateBlock.execute(
            state,
            event.user,
            {
                uuid = event.data.block.uuid;
                var blockType = event.data.block.blockType;
                var content = [];
                parent = event.data.block.parent;
                properties = {
                    title = ?Tree.Tree(null);
                    checked = ?false;
                };
            },
        );

        switch (result) {
            case (#err(#anonymousUser)) {
                Debug.print("Failed to create block. User is anonymous");
            };
            case (#err(#failedToCreate)) {
                Debug.print("Failed to create block");
            };
            case (#err(#inputTooLong)) {
                Debug.print("Failed to create block. Input too long");
            };
            case (#err(#insufficientCycles)) {
                Debug.print("Failed to create block. Insufficient cycles");
            };
            case (#err(#invalidBlockType)) {
                Debug.print("Failed to create block. Invalid block type");
            };
            case (#ok(block)) {
                Debug.print("Block created:" # Nat.toText(block.id));

                switch (event.data.block.parent) {
                    case (null) {
                        Debug.print("Failed to create block. Parent block not specified");
                    };
                    case (?parent) {
                        let parentBlock = _blockByUuid(state, parent);

                        switch (parentBlock) {
                            case (#err(#blockNotFound)) {
                                Debug.print(UUID.toText(parent));
                                Debug.print("Failed to add block to parent block. Parent block not found");
                            };
                            case (#ok(parentBlock)) {
                                let contentBeforeIndex = Buffer.fromArray<UUID.UUID>(Iter.toArray(Array.slice<UUID.UUID>(parentBlock.content, 0, event.data.index)));
                                let contentAfterIndex = Buffer.fromArray<UUID.UUID>(Iter.toArray(Array.slice<UUID.UUID>(parentBlock.content, event.data.index, Array.size<UUID.UUID>(parentBlock.content))));
                                var updatedContent = Buffer.clone(contentBeforeIndex);
                                updatedContent.append(Buffer.fromArray([event.data.block.uuid]));
                                updatedContent.append(contentAfterIndex);

                                let updateResult = UpdateBlock.execute(
                                    state,
                                    event.user,
                                    {
                                        uuid = parentBlock.uuid;
                                        var blockType = parentBlock.blockType;
                                        var content = Buffer.toArray(updatedContent);
                                        id = parentBlock.id;
                                        parent = parentBlock.parent;
                                        properties = parentBlock.properties;
                                    },
                                );
                                Debug.print("Block added to parent block:" # Nat.toText(parentBlock.id));
                            };
                        };
                    };
                };

            };
        };
    };
};
