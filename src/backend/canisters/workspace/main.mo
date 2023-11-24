import Array "mo:base/Array";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Time = "mo:base/Time";
import Timer = "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Error "mo:base/Error";
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

shared ({ caller = initializer }) actor class Workspace(
    initArgs : CoreTypes.Workspaces.WorkspaceInitArgs,
    initData : CoreTypes.Workspaces.WorkspaceInitData,
) = self {
    /*************************************************************************
     * Types
     *************************************************************************/

    type BlockByUuidResult = Types.Queries.BlockByUuid.BlockByUuidResult;
    type PrimaryKey = Types.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type ShareableBlock_v2 = BlocksTypes.ShareableBlock_v2;

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var blocks : RBTree.Tree<PrimaryKey, ShareableBlock> = #leaf;
    stable var blocks_v2 : RBTree.Tree<PrimaryKey, ShareableBlock_v2> = #leaf;
    stable var blocksIdCounter : Nat = 0;
    stable var owner : CoreTypes.Workspaces.WorkspaceOwner = initArgs.owner;
    stable var uuid : UUID.UUID = initData.uuid;
    stable var name : CoreTypes.Workspaces.WorkspaceName = initData.name;
    stable var description : CoreTypes.Workspaces.WorkspaceDescription = initData.name;
    stable var createdAt : Time.Time = initData.createdAt;
    stable var updatedAt : Time.Time = initData.updatedAt;
    stable let workspaceIndexCanisterId = initializer;
    stable let capacity : Nat = initArgs.capacity;
    stable var balance : Nat = ExperimentalCycles.balance();

    /*************************************************************************
     * Transient Data
     *************************************************************************/

    var data = State.Data({
        blocks = {
            id = blocksIdCounter;
            data = blocks;
        };
        blocks_v2 = {
            id = blocksIdCounter;
            data = blocks_v2;
        };
    });
    var state = State.State(data);
    let eventStream = LseqEvents.EventStream<BlocksTypes.BlockEvent>();

    /*************************************************************************
     * Initialization helper methods
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

    public query func blockByUuid(uuid : UUID.UUID) : async Result.Result<ShareableBlock_v2, { #blockNotFound }> {
        switch (state.data.getBlockByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block_v2.toShareable(block));
            };
        };
    };

    public query func pageByUuid(uuid : UUID.UUID) : async Result.Result<ShareableBlock_v2, { #pageNotFound }> {
        switch (state.data.getPageByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block_v2.toShareable(block));
            };
        };
    };

    public query ({ caller }) func pages(
        options : {
            cursor : ?PrimaryKey;
            limit : ?Nat;
            order : ?CoreTypes.SortOrder;
        }
    ) : async CoreTypes.PaginatedResults<ShareableBlock_v2> {
        let { cursor; limit; order } = options;
        let pages = state.data.getPages(cursor, limit, order);
        let result = {
            edges = List.toArray<CoreTypes.Edge<ShareableBlock_v2>>(
                List.map<BlocksTypes.Block_v2, CoreTypes.Edge<ShareableBlock_v2>>(
                    pages,
                    func(block) {
                        { node = BlocksModels.Block_v2.toShareable(block) };
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
        var block_id = state.data.addBlock(BlocksModels.Block_v2.fromShareableUnsaved(input));

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
        let result = state.data.updateBlock(BlocksModels.Block_v2.fromShareable(input));

        switch (result) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(pk, block)) {
                #ok(BlocksModels.Block_v2.toShareable(block));
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
                    let block = BlocksModels.Block_v2.fromShareableUnsaved({
                        event.data.block and {} with content = LseqTree.toShareableTree(LseqTree.Tree(null));
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
                                parent = block.parent;
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
                                    checked = block.properties.checked;
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

    // Returns the cycles received up to the capacity allowed
    public shared func walletReceive() : async { accepted : Nat64 } {
        let amount = ExperimentalCycles.available();
        let limit : Nat = capacity - ExperimentalCycles.balance();
        let accepted = if (amount <= limit) amount else limit;
        let deposit = ExperimentalCycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        return { accepted = Nat64.fromNat(0) };
    };

    // Return the current cycle balance
    public shared func cyclesInformation() : async {
        balance : Nat;
        capacity : Nat;
    } {
        return {
            balance = ExperimentalCycles.balance();
            capacity = capacity;
        };
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
                    // TODO: Add case for content updated
                    case (#updateContent(event)) {
                        Debug.print("UUID: " # UUID.toText(event.uuid));
                    };
                    case (#updateBlockType(event)) {
                        Debug.print("UUID: " # UUID.toText(event.uuid));
                    };
                    case (#updatePropertyTitle(event)) {
                        Debug.print("UUID: " # UUID.toText(event.uuid));
                    };
                    case (#updatePropertyChecked(event)) {
                        Debug.print("UUID: " # UUID.toText(event.uuid));
                    };
                    case (#updateParent(event)) {
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

    func startListeningForEvents() : async () {
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
                            case (#updateContent(event)) { event.uuid };
                            case (#updatePropertyTitle(event)) { event.uuid };
                            case (#updatePropertyChecked(event)) { event.uuid };
                            case (#updateParent(event)) { event.uuid };
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

    /*************************************************************************
     * Timers
     *************************************************************************/
    private func startTimers() {
        ignore Timer.setTimer(
            #nanoseconds(0),
            startListeningForEvents,
        );
    };

    startTimers();

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        Debug.print("Preupgrade for workspace: " # Principal.toText(Principal.fromActor(self)));

        let transformedData = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock_v2>(Nat.compare);

        for (block in state.data.Block.objects.data.entries()) {
            let blockId = block.0;
            let blockData = block.1;

            let currentContent : BlocksTypes.BlockContent = blockData.content;
            let transformedContent : BlocksTypes.BlockContent_v2 = LseqTree.Tree(null);

            for (blockUuid in Array.vals(currentContent)) {
                ignore LseqTree.insertCharacterAtEnd(transformedContent, UUID.toText(blockUuid));
            };

            let upgradedBlock : BlocksTypes.Block_v2 = {
                blockData and {} with
                content = transformedContent;
                var blockType = blockData.blockType;
                var parent = blockData.parent;
            };

            transformedData.put(blockId, BlocksModels.Block_v2.toShareable(upgradedBlock));
        };

        blocks_v2 := transformedData.share();
        blocksIdCounter := state.data.Block.id_manager.current();
    };

    system func postupgrade() {
        Debug.print("Postupgrade for workspace: " # Principal.toText(Principal.fromActor(self)));

        let refreshData = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock_v2>(Nat.compare);
        refreshData.unshare(blocks_v2);

        for (entry in refreshData.entries()) {
            state.data.Block_v2.objects.data.put(entry.0, BlocksModels.Block_v2.fromShareable(entry.1));
        };

        // Restart timers
        startTimers();
    };
};
