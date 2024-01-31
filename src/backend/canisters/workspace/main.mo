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
import Canistergeek "mo:canistergeek/canistergeek";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import BlocksModels "../../lib/blocks/models";
import BlocksTypes "../../lib/blocks/types";
import BlocksUtils "../../lib/blocks/utils";
import CoreTypes "../../types";
import CyclesUtils "../../utils/cycles";
import LseqEvents "../../utils/data/lseq/Events";
import LseqTree "../../utils/data/lseq/Tree";

import BlockCreatedConsumer "./consumers/BlockCreatedConsumer";
import BlockUpdatedConsumer "./consumers/BlockUpdatedConsumer";
import State "./model/state";
import CreatePage "./services/create_page";
import Types "./types/v0";

shared ({ caller = initializer }) actor class Workspace(
    initArgs : CoreTypes.Workspaces.WorkspaceInitArgs,
    initData : CoreTypes.Workspaces.WorkspaceInitData,
) = self {
    /*************************************************************************
     * Types
     *************************************************************************/

    type BlockByUuidResult = Types.Queries.BlockByUuid.BlockByUuidResult;
    type BlocksByPageUuidResult = Types.Queries.BlocksByPageUuid.BlocksByPageUuidResult;
    type PageByUuidResult = Types.Queries.PageByUuid.PageByUuidResult;
    type PagesOptionsArg = Types.Queries.Pages.PagesOptionsArg;
    type PagesResult = Types.Queries.Pages.PagesResult;

    type PrimaryKey = Types.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var blocks : RBTree.Tree<PrimaryKey, ShareableBlock> = #leaf;
    stable var blocksIdCounter : Nat = 0;

    stable var owner : CoreTypes.Workspaces.WorkspaceOwner = initArgs.owner;
    stable var uuid : UUID.UUID = initData.uuid;
    stable var name : CoreTypes.Workspaces.WorkspaceName = initData.name;
    stable var description : CoreTypes.Workspaces.WorkspaceDescription = initData.name;
    stable var websiteLink : ?Text = null;
    stable var createdAt : Time.Time = initData.createdAt;
    stable var updatedAt : Time.Time = initData.updatedAt;

    stable let capacity : Nat = initArgs.capacity;
    stable var balance : Nat = ExperimentalCycles.balance();

    // CanisterGeek
    private let canistergeekMonitor = Canistergeek.Monitor();
    private let canistergeekLogger = Canistergeek.Logger();
    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var _canistergeekLoggerUD : ?Canistergeek.LoggerUpgradeData = null;

    /*************************************************************************
     * Transient Data
     *************************************************************************/

    var timersHaveBeenStarted = false;
    var data = State.Data({
        blocks = {
            id = blocksIdCounter;
            data = blocks;
        };
    });
    var state = State.State(data);
    let eventStream = LseqEvents.EventStream<BlocksTypes.BlockEvent>({
        getEventId = BlocksUtils.getEventId;
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

    public query func blockByUuid(uuid : UUID.UUID) : async BlockByUuidResult {
        let result = switch (state.data.getBlockByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block.toShareable(block));
            };
        };

        return result;
    };

    public query func blocksByPageUuid(uuid : Text) : async List.List<ShareableBlock> {
        let blocks = state.data.getBlocksByPageUuid(uuid);
        let result = List.map<BlocksTypes.Block, ShareableBlock>(
            blocks,
            BlocksModels.Block.toShareable,
        );

        return result;
    };

    public query func pageByUuid(uuid : UUID.UUID) : async PageByUuidResult {
        let result = switch (state.data.getPageByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(BlocksModels.Block.toShareable(block));
            };
        };

        return result;
    };

    public query ({ caller }) func pages(options : PagesOptionsArg) : async PagesResult {
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
     * Updates
     *************************************************************************/

    public shared ({ caller }) func createPage(
        input : Types.Updates.CreatePageUpdate.CreatePageUpdateInput
    ) : async Types.Updates.CreatePageUpdate.CreatePageUpdateOutput {
        let result = await CreatePage.execute(state, caller, input);
        canistergeekMonitor.updateInformation({ metrics = ? #normal });
        return result;
    };

    public shared ({ caller }) func addBlock(
        input : Types.Updates.AddBlockUpdate.AddBlockUpdateInput
    ) : async Types.Updates.AddBlockUpdate.AddBlockUpdateOutput {
        var block_id = state.data.addBlock(BlocksModels.Block.fromShareableUnsaved(input));
        let result = switch (block_id) {
            case (#err(#keyAlreadyExists)) { #err };
            case (#ok(id, block)) { #ok(block) };
        };
        canistergeekMonitor.updateInformation({ metrics = ? #normal });
        return result;

    };

    public shared ({ caller }) func updateBlock(
        input : Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput
    ) : async Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput {
        let result = state.data.updateBlock(BlocksModels.Block.fromShareable(input));
        let finalResult = switch (result) {
            case (#err(err)) { #err(err) };
            case (#ok(_, block)) {
                #ok(BlocksModels.Block.toShareable(block));
            };
        };
        canistergeekMonitor.updateInformation({ metrics = ? #normal });
        return finalResult;
    };

    public shared ({ caller }) func deletePage(
        input : Types.Updates.DeletePageUpdate.DeletePageUpdateInput
    ) : async Types.Updates.DeletePageUpdate.DeletePageUpdateOutput {
        let result = #ok(state.data.deleteBlockByUuid(input.uuid));
        canistergeekMonitor.updateInformation({ metrics = ? #normal });
        return result;
    };

    public shared ({ caller }) func saveEvents(
        input : Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput
    ) : async Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput {
        for (event in input.transaction.vals()) {
            switch (event) {
                case (#empty) {};
                case (#blockCreated(event)) {
                    let block = BlocksModels.Block.fromShareableUnsaved({
                        event.data.block and {} with content = LseqTree.toShareableTree(
                            LseqTree.Tree(null)
                        );
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

                    canistergeekLogger.logMessage(
                        "Publishing blockCreated event: " #
                        debug_show UUID.toText(event.uuid) #
                        "\n\tblock id: " #
                        debug_show UUID.toText(event.data.block.uuid)
                    );

                    eventStream.publish(eventToPublish);
                    return #ok();
                };
                case (#blockUpdated(event)) {
                    canistergeekLogger.logMessage(
                        "Publishing blockUpdated event: " #
                        debug_show BlocksUtils.getEventId(#blockUpdated(event))
                    );
                    eventStream.publish(#blockUpdated(event));
                    return #ok();
                };
            };
        };

        canistergeekMonitor.updateInformation({ metrics = ? #normal });
        #ok();
    };

    // Returns the cycles received up to the capacity allowed
    public shared func walletReceive() : async { accepted : Nat64 } {
        let result = await CyclesUtils.walletReceive(capacity - ExperimentalCycles.balance());
        canistergeekMonitor.updateInformation({ metrics = ? #normal });
        return result;
    };

    /*************************************************************************
     * Event Handling
     *************************************************************************/

    func startListeningForEvents() : async () {
        canistergeekLogger.logMessage("Listening for events...");
        eventStream.addEventListener(
            "BlockEventListener",
            func(event) {
                canistergeekLogger.logMessage("Received event: " # debug_show event);
                switch (event) {
                    case (#empty) {};
                    case (#blockCreated(blockCreatedEvent)) {
                        canistergeekLogger.logMessage("Processing blockCreated event: " # debug_show (BlocksUtils.getEventId(event)));
                        BlockCreatedConsumer.execute(blockCreatedEvent, state);
                        canistergeekLogger.logMessage(
                            "Processed blockCreated event: " #
                            debug_show UUID.toText(blockCreatedEvent.uuid)
                        );
                    };
                    case (#blockUpdated(blockUpdatedEvent)) {
                        canistergeekLogger.logMessage("Processing blockUpdated event: " # debug_show (BlocksUtils.getEventId(event)) # "\n" # debug_show event);
                        let res = BlockUpdatedConsumer.execute(blockUpdatedEvent, state);
                        let uuid = BlocksUtils.getEventId(event);

                        switch (res) {
                            case (#err(err)) {
                                canistergeekLogger.logMessage(
                                    "Error processing blockUpdated event: " #
                                    debug_show uuid #
                                    "\n\t" #
                                    debug_show err
                                );
                            };
                            case (#ok(_)) {
                                canistergeekLogger.logMessage(
                                    "Processed blockUpdated event: " #
                                    debug_show uuid
                                );
                            };
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

    /**
    * Returns canister information based on passed parameters.
    * Called from browser.
    */
    public query ({ caller }) func getCanistergeekInformation(
        request : Canistergeek.GetInformationRequest
    ) : async Result.Result<Canistergeek.GetInformationResponse, { #unauthorized }> {
        switch (validateCaller(caller)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(_)) {
                #ok(Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request));
            };
        };
    };

    /**
     * Updates canister information based on passed parameters at current time.
     * Called from browser or any canister "update" method.
     */
    public shared ({ caller }) func updateCanistergeekInformation(
        request : Canistergeek.UpdateInformationRequest
    ) : async Result.Result<(), { #unauthorized }> {
        switch (validateCaller(caller)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(_)) {
                canistergeekMonitor.updateInformation(request);
                #ok;
            };
        };
    };

    private func validateCaller(
        principal : Principal
    ) : Result.Result<Principal, { #unauthorized }> {
        if (principal == Principal.fromActor(self)) {
            return #ok(principal);
        };

        if (principal == owner) {
            return #ok(principal);
        };

        return #err(#unauthorized);
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
        let shareableBlocks = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock>(Nat.compare);

        for (block in state.data.Block.objects.data.entries()) {
            let blockId = block.0;
            let blockData = block.1;
            shareableBlocks.put(blockId, BlocksModels.Block.toShareable(blockData));
        };

        blocks := shareableBlocks.share();
        blocksIdCounter := state.data.Block.id_manager.current();

        doCanisterGeekPreUpgrade();
    };

    system func postupgrade() {
        doCanisterGeekPostUpgrade();

        let refreshData = RBTree.RBTree<Nat, BlocksTypes.ShareableBlock>(Nat.compare);
        refreshData.unshare(blocks);

        for (entry in refreshData.entries()) {
            let blockId = entry.0;
            let block = entry.1;
            state.data.Block.objects.data.put(blockId, BlocksModels.Block.fromShareable(block));
            state.data.addBlockToBlocksByParentIdIndex(BlocksModels.Block.fromShareable(block));
        };

        // Restart timers
        startTimers();
    };
};
