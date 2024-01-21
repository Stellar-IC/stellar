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
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";
import Canistergeek "mo:canistergeek/canistergeek";

import BlocksModels "../../lib/blocks/models";
import BlocksTypes "../../lib/blocks/types";
import CoreTypes "../../types";
import LseqEvents "../../utils/data/lseq/Events";
import LseqTree "../../utils/data/lseq/Tree";

import BlockCreatedConsumer "./consumers/BlockCreatedConsumer";
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
    type ShareableBlock = BlocksTypes.ShareableBlock_v2;

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var blocks_v2 : RBTree.Tree<PrimaryKey, ShareableBlock> = #leaf;
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
    var timersHaveBeenStarted = false;

    /*************************************************************************
     * Transient Data
     *************************************************************************/

    var data = State.Data({
        blocks_v2 = {
            id = blocksIdCounter;
            data = blocks_v2;
        };
    });
    var state = State.State(data);
    let eventStream = LseqEvents.EventStream<BlocksTypes.BlockEvent>({
        getEventId = func(event) {
            switch (event) {
                case (#empty) {
                    return "";
                };
                case (#blockCreated(event)) {
                    return UUID.toText(event.uuid);
                };
                case (#blockUpdated(event)) {
                    return switch (event) {
                        case (#updateBlockType(event)) {
                            UUID.toText(event.uuid);
                        };
                        case (#updateContent(event)) { UUID.toText(event.uuid) };
                        case (#updatePropertyTitle(event)) {
                            UUID.toText(event.uuid);
                        };
                        case (#updatePropertyChecked(event)) {
                            UUID.toText(event.uuid);
                        };
                        case (#updateParent(event)) { UUID.toText(event.uuid) };
                    };
                };
            };
        };
    });

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

    public query func blockByUuid(uuid : UUID.UUID) : async Result.Result<ShareableBlock, { #blockNotFound }> {
        switch (state.data.getBlockByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block_v2.toShareable(block));
            };
        };
    };

    public query func blocksByPageUuid(uuid : Text) : async List.List<ShareableBlock> {
        let blocks = state.data.getBlocksByPageUuid(uuid);
        return List.map<BlocksTypes.Block_v2, ShareableBlock>(
            blocks,
            BlocksModels.Block_v2.toShareable,
        );
    };

    public query func pageByUuid(uuid : UUID.UUID) : async Result.Result<ShareableBlock, { #pageNotFound }> {
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
    ) : async CoreTypes.PaginatedResults<ShareableBlock> {
        let { cursor; limit; order } = options;
        let pages = state.data.getPages(cursor, limit, order);
        let result = {
            edges = List.toArray<CoreTypes.Edge<ShareableBlock>>(
                List.map<BlocksTypes.Block_v2, CoreTypes.Edge<ShareableBlock>>(
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

    public shared ({ caller }) func deletePage(input : Types.Updates.DeletePageUpdate.DeletePageUpdateInput) : async Types.Updates.DeletePageUpdate.DeletePageUpdateOutput {
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
                        uuid = event.uuid;
                        user = event.user;
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
                    });
                    eventStream.publish(eventToPublish);
                    return #ok();
                };
                case (#blockUpdated(event)) {
                    eventStream.publish(#blockUpdated(event));
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

    func startListeningForEvents() : async () {
        eventStream.addEventListener(
            "test",
            func(event) {
                switch (event) {
                    case (#empty) {};
                    case (#blockCreated(event)) {
                        BlockCreatedConsumer.execute(event, state);
                    };
                    case (#blockUpdated(event)) {
                        let res = BlockUpdatedConsumer.execute(event, state);
                        let uuid = switch (event) {
                            case (#updateBlockType(event)) { event.uuid };
                            case (#updateContent(event)) { event.uuid };
                            case (#updatePropertyTitle(event)) { event.uuid };
                            case (#updatePropertyChecked(event)) { event.uuid };
                            case (#updateParent(event)) { event.uuid };
                        };

                        switch (res) {
                            case (#err(err)) {};
                            case (#ok(_)) {};
                        };
                    };
                };
            },
        );
    };

    private func startProcessingEvents() : async () {
        eventStream.processEvents();
    };

    /*************************************************************************
     * Canister Monitoring
     *************************************************************************/

    // CanisterGeek
    private let canistergeekMonitor = Canistergeek.Monitor();
    private let canistergeekLogger = Canistergeek.Logger();
    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var _canistergeekLoggerUD : ?Canistergeek.LoggerUpgradeData = null;

    /**
    * Returns canister information based on passed parameters.
    * Called from browser.
    */
    public query ({ caller }) func getCanistergeekInformation(request : Canistergeek.GetInformationRequest) : async Canistergeek.GetInformationResponse {
        validateCaller(caller);
        Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request);
    };

    /**
    * Updates canister information based on passed parameters at current time.
    * Called from browser or any canister "update" method.
    */
    public shared ({ caller }) func updateCanistergeekInformation(request : Canistergeek.UpdateInformationRequest) : async () {
        validateCaller(caller);
        canistergeekMonitor.updateInformation(request);
    };

    private func validateCaller(principal : Principal) : () {
        //limit access here!
    };

    private func doCanisterGeekPreUpgrade() {
        _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
        _canistergeekLoggerUD := ?canistergeekLogger.preupgrade();
    };

    private func doCanisterGeekPostUpgrade() {
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        _canistergeekMonitorUD := null;

        canistergeekLogger.postupgrade(_canistergeekLoggerUD);
        _canistergeekLoggerUD := null;

        //Optional: override default number of log messages to your value
        canistergeekLogger.setMaxMessagesCount(3000);
    };

    /*************************************************************************
     * Timers
     *************************************************************************/
    private func startTimers() {
        if (timersHaveBeenStarted) {
            return;
        };
        ignore Timer.setTimer(
            #nanoseconds(0),
            startListeningForEvents,
        );
        ignore Timer.recurringTimer(
            #nanoseconds(500_000_000),
            startProcessingEvents,
        );
    };

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        let shareableBlocks = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock_v2>(Nat.compare);

        for (block in state.data.Block_v2.objects.data.entries()) {
            let blockId = block.0;
            let blockData = block.1;
            shareableBlocks.put(blockId, BlocksModels.Block_v2.toShareable(blockData));
        };

        blocks_v2 := shareableBlocks.share();
        blocksIdCounter := state.data.Block_v2.id_manager.current();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        let refreshData = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock_v2>(Nat.compare);
        refreshData.unshare(blocks_v2);

        for (entry in refreshData.entries()) {
            let blockId = entry.0;
            let block = entry.1;
            state.data.Block_v2.objects.data.put(blockId, BlocksModels.Block_v2.fromShareable(block));
            state.data.addBlockToBlocksByParentIdIndex(BlocksModels.Block_v2.fromShareable(block));
        };

        // Restart timers
        startTimers();

        doCanisterGeekPostUpgrade();
    };
};
