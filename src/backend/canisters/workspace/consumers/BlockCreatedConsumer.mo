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
    type Block = BlocksTypes.Block_v2;

    func _blockByUuid(state : State.State, uuid : UUID.UUID) : Result.Result<Block, { #blockNotFound }> {
        state.data.getBlockByUuid(uuid);
    };

    public func execute(event : BlocksTypes.BlockCreatedEvent, state : State.State) : () {
        let result = CreateBlock.execute(
            state,
            event.user,
            {
                uuid = event.data.block.uuid;
                var blockType = event.data.block.blockType;
                content = Tree.Tree(null);
                var parent = event.data.block.parent;
                properties = {
                    title = ?Tree.Tree(null);
                    var checked = ?false;
                };
            },
        );

        let block = switch (result) {
            case (#err(#anonymousUser)) {
                Debug.print("Failed to create block. User is anonymous");
                return ();
            };
            case (#err(#failedToCreate)) {
                Debug.print("Failed to create block");
                return ();
            };
            case (#err(#inputTooLong)) {
                Debug.print("Failed to create block. Input too long");
                return ();
            };
            case (#err(#insufficientCycles)) {
                Debug.print("Failed to create block. Insufficient cycles");
                return ();
            };
            case (#err(#invalidBlockType)) {
                Debug.print("Failed to create block. Invalid block type");
                return ();
            };
            case (#ok(block)) {
                Debug.print("Block created:" # Nat.toText(block.id));
                block;
            };
        };

        let parentBlock = switch (event.data.block.parent) {
            case (null) {
                Debug.print("Failed to add block to parent block. Parent block not specified");
                return ();
            };
            case (?parent) {
                let parentBlock = _blockByUuid(state, parent);

                switch (parentBlock) {
                    case (#err(#blockNotFound)) {
                        Debug.print(UUID.toText(parent));
                        Debug.print("Failed to add block to parent block. Parent block not found");
                        return ();
                    };
                    case (#ok(parentBlock)) {
                        parentBlock;
                    };
                };
            };
        };

    };
};
