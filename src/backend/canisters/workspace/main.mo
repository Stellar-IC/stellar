import Array "mo:base/Array";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Time = "mo:base/Time";
import Timer = "mo:base/Timer";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import BlocksModels "../../lib/blocks/models";
import BlocksTypes "../../lib/blocks/types";
import CoreTypes "../../types";
import LseqEvents "../../utils/data/lseq/Events";
import LseqTree "../../utils/data/lseq/Tree";

import BlockCreatedConsumer "./consumers/BlockCreatedConsumer";
import BlockRemovedConsumer "./consumers/BlockRemovedConsumer";
import BlockUpdatedConsumer "./consumers/BlockUpdatedConsumer";
import State "./model/state";
import CreatePage "./services/create_page";
import Types "./types";

actor class Workspace(
    initArgs : {
        capacity : Nat;
        owner : Principal;
    },
    initData : {
        uuid : UUID.UUID;
        name : CoreTypes.Workspaces.WorkspaceName;
        description : CoreTypes.Workspaces.WorkspaceDescription;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    },
) {
    /*************************************************************************
     * Types
     *************************************************************************/

    type BlockByUuidResult = Types.Queries.BlockByUuid.BlockByUuidResult;
    type PrimaryKey = Types.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var stable_blocks : RBTree.Tree<PrimaryKey, ShareableBlock> = #leaf;
    stable var stable_blocks_id_counter = 0;

    stable var owner : CoreTypes.Workspaces.WorkspaceOwner = initArgs.owner;

    stable var uuid : UUID.UUID = initData.uuid;
    stable var name : CoreTypes.Workspaces.WorkspaceName = initData.name;
    stable var description : CoreTypes.Workspaces.WorkspaceDescription = initData.name;
    stable var createdAt : Time.Time = initData.createdAt;
    stable var updatedAt : Time.Time = initData.updatedAt;

    /*************************************************************************
     * Transient Data
     *************************************************************************/

    var state = State.State(State.Data({ blocks = { id = stable_blocks_id_counter; data = stable_blocks } }));

    let eventStream = LseqEvents.EventStream<BlocksTypes.BlockEvent>();

    /*************************************************************************
     * Initialization
     *************************************************************************/
    public func getInitArgs() : async {
        capacity : Nat;
        owner : Principal;
    } {
        return initArgs;
    };

    public func getInitData() : async {
        uuid : UUID.UUID;
        name : CoreTypes.Workspaces.WorkspaceName;
        description : CoreTypes.Workspaces.WorkspaceDescription;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    } {
        return initData;
    };

    /*************************************************************************
     * Queries
     *************************************************************************/

    public query func toObject() : async CoreTypes.Workspaces.Workspace {
        return {
            uuid = uuid;
            name = name;
            description = description;
            owner = owner;
            createdAt = createdAt;
            updatedAt = updatedAt;
        };
    };

    public query func blockByUuid(uuid : UUID.UUID) : async Result.Result<ShareableBlock, { #blockNotFound }> {
        switch (state.data.getBlockByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block.toShareable(block));
            };
        };
    };

    public query func pageByUuid(uuid : UUID.UUID) : async Result.Result<ShareableBlock, { #pageNotFound }> {
        switch (state.data.getPageByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block.toShareable(block));
            };
        };
    };

    public query ({ caller }) func pages(
        options : {
            cursor : ?PrimaryKey;
            limit : ?Nat;
            order : ?CoreTypes.SortOrder;
        }
    ) : async CoreTypes.PaginatedResults<ShareableBlock> {
        if (caller != owner) {
            return { edges = [] };
        };

        let { cursor; limit; order } = options;
        let pages = state.data.getPages(cursor, limit, order);
        let result = {
            edges = List.toArray<CoreTypes.Edge<ShareableBlock>>(
                List.map<BlocksTypes.Block, CoreTypes.Edge<ShareableBlock>>(
                    pages,
                    func(block) {
                        { node = BlocksModels.Block.toShareable(block) };
                    },
                )
            );
        };

        return result;
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    public shared ({ caller }) func createPage(input : Types.Updates.CreatePageUpdate.CreatePageUpdateInput) : async Types.Updates.CreatePageUpdate.CreatePageUpdateOutput {
        await CreatePage.execute(state, caller, input);
    };

    public shared ({ caller }) func addBlock(input : Types.Updates.AddBlockUpdate.AddBlockUpdateInput) : async Types.Updates.AddBlockUpdate.AddBlockUpdateOutput {
        var block_id = state.data.addBlock(BlocksModels.Block.fromShareableUnsaved(input));

        switch (block_id) {
            case (#err(#keyAlreadyExists)) {
                #err;
            };
            case (#ok(id, block)) {
                #ok(block);
            };
        };
    };

    public shared ({ caller }) func updateBlock(input : Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput) : async Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput {
        let result = state.data.updateBlock(BlocksModels.Block.fromShareable(input));

        switch (result) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(pk, block)) {
                #ok(BlocksModels.Block.toShareable(block));
            };
        };
    };

    public shared ({ caller }) func removeBlock(input : Types.Updates.RemoveBlockUpdate.RemoveBlockUpdateInput) : async Types.Updates.RemoveBlockUpdate.RemoveBlockUpdateOutput {
        return #ok(state.data.deleteBlockByUuid(input.uuid));
    };

    public shared ({ caller }) func saveEvents(input : Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput) : async Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput {
        for (event in input.transaction.vals()) {
            switch (event) {
                case (#empty) {};
                case (#blockCreated(event)) {
                    let block = BlocksModels.Block.fromShareableUnsaved({
                        event.data.block and {} with content = [];
                        properties = {
                            title = ?LseqTree.toShareableTree(LseqTree.Tree(null));
                            checked = ?false;
                        };
                    });

                    let eventToPublish : {
                        #blockCreated : BlocksTypes.BlockCreatedEvent;
                    } = #blockCreated({
                        uuid = await Source.Source().new();
                        data = {
                            block = {
                                block and {} with
                                content = block.content;
                                blockType = block.blockType;
                                properties = {
                                    block.properties and {} with
                                    title = switch (block.properties.title) {
                                        case (null) {
                                            ?LseqTree.toShareableTree(LseqTree.Tree(null));
                                        };
                                        case (?title) {
                                            ?LseqTree.toShareableTree(title);
                                        };
                                    };
                                };
                            };
                            index = event.data.index;
                        };
                        user = caller;
                    });
                    eventStream.publish(eventToPublish);
                    return #ok();
                };
                case (#blockUpdated(event)) {
                    eventStream.publish(#blockUpdated(event));
                    return #ok();
                };
                case (#blockRemoved(event)) {
                    eventStream.publish(#blockRemoved(event));
                    return #ok();
                };
            };
            // Debug.trap("Unknown event type");
        };

        #ok();
    };

    /*************************************************************************
     * Event Handling
     *************************************************************************/

    func logEvent(event : BlocksTypes.BlockEvent) : () {
        Debug.print("");
        Debug.print("Logging event");
        switch (event) {
            case (#empty) {};
            case (#blockCreated(event)) {
                Debug.print("TYPE: Block Created");
                Debug.print("UUID: " # UUID.toText(event.uuid));
            };
            case (#blockUpdated(event)) {
                Debug.print("TYPE: Block Updated");
                switch (event) {
                    case (#updateBlockType(event)) {
                        Debug.print("UUID: " # UUID.toText(event.uuid));
                    };
                    case (#updatePropertyTitle(event)) {
                        Debug.print("UUID: " # UUID.toText(event.uuid));
                    };
                };
            };
            case (#blockRemoved(event)) {
                Debug.print("TYPE: Block Removed");
                Debug.print("UUID: " # UUID.toText(event.uuid));
            };
        };
    };

    func processEvents() : async () {
        eventStream.addEventListener(
            "test",
            func(event) {
                Debug.print("Received event: ");
                logEvent(event);

                switch (event) {
                    case (#empty) {};
                    case (#blockCreated(event)) {
                        Debug.print("Processing `blockCreated` event");
                        BlockCreatedConsumer.execute(event, state);
                        Debug.print("Successfully processed `blockCreated` event: " # UUID.toText(event.uuid));
                    };
                    case (#blockUpdated(event)) {
                        Debug.print("Processing `blockUpdated` event");
                        let res = BlockUpdatedConsumer.execute(event, state);
                        let uuid = switch (event) {
                            case (#updateBlockType(event)) { event.uuid };
                            case (#updatePropertyTitle(event)) { event.uuid };
                        };

                        switch (res) {
                            case (#err(err)) {
                                Debug.print("Failed to process `blockUpdated` event: " # UUID.toText(uuid));
                            };
                            case (#ok(_)) {
                                Debug.print("Successfully processed `blockUpdated` event: " # UUID.toText(uuid));
                            };
                        };
                    };
                    case (#blockRemoved(event)) {
                        Debug.print("Processing `blockRemoved` event");
                        let res = BlockRemovedConsumer.execute(event, state);
                        switch (res) {
                            case (#err(err)) {
                                Debug.print("Failed to process `blockUpdated` event: " # UUID.toText(event.uuid));
                            };
                            case (#ok(_)) {
                                Debug.print("Successfully processed `blockUpdated` event: " # UUID.toText(event.uuid));
                            };
                        };
                        Debug.print("Successfully processed `blockRemoved` event: " # UUID.toText(event.uuid));
                    };
                };
            },
        );
    };

    let timer = Timer.setTimer(
        #nanoseconds(0),
        processEvents,
    );

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        let transformedData = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock>(Nat.compare);

        for (block in state.data.Block.objects.data.entries()) {
            transformedData.put(block.0, BlocksModels.Block.toShareable(block.1));
        };

        stable_blocks := transformedData.share();
        stable_blocks_id_counter := state.data.Block.id_manager.current();
    };

    system func postupgrade() {
        // let refreshData = RBTree.RBTree<Nat, Types.ShareableBlock>(Nat.compare);
        // refreshData.unshare(stable_blocks);

        // for (entry in refreshData.entries()) {
        //     state.data.Block.objects.data.put(entry.0, Block.fromShareable(entry.1));
        // };

        stable_blocks := #leaf;
        stable_blocks_id_counter := 0;

    };
};
