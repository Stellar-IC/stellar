import Array "mo:base/Array";
import Deque "mo:base/Deque";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import Time = "mo:base/Time";
import Timer = "mo:base/Timer";

import Canistergeek "mo:canistergeek/canistergeek";

import UUID "mo:uuid/UUID";

import ActivityBuilder "../../lib/activities/ActivityBuilder";
import BlocksModels "../../lib/blocks/models";
import BlocksTypes "../../lib/blocks/types";
import UUIDGenerator "../../lib/shared/UUIDGenerator";

import CoreTypes "../../types";

import CyclesUtils "../../utils/cycles";
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
    type BlocksByPageUuidResult = Types.Queries.BlocksByPageUuid.BlocksByPageUuidResult;
    type PageByUuidResult = Types.Queries.PageByUuid.PageByUuidResult;
    type PagesOptionsArg = Types.Queries.Pages.PagesOptionsArg;
    type PagesResult = Types.Queries.Pages.PagesResult;
    type PrimaryKey = Types.PrimaryKey;

    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type BlockEvent = BlocksTypes.BlockEvent;

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var blocks : RBTree.Tree<PrimaryKey, ShareableBlock> = #leaf;
    stable var blocksIdCounter : Nat = 0;
    stable var events : RBTree.Tree<Text, BlockEvent> = #leaf;
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
        events = events;
    });
    var state = State.State(data);
    let uuidGenerator = UUIDGenerator.UUIDGenerator();

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
        let result = switch (state.data.findBlockByUuid(uuid)) {
            case (#err(err)) { #err(err) };
            case (#ok(block)) { #ok(BlocksModels.Block.toShareable(block)) };
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
        let page = switch (state.data.getPageByUuid(uuid)) {
            case (#err(err)) { return #err(err) };
            case (#ok(page)) { page };
        };
        let content = LseqTree.toArray(page.content);
        let blocks = state.data.getBlocksByPageUuid(UUID.toText(page.uuid));
        let shareableBlocks = List.map<BlocksTypes.Block, ShareableBlock>(
            blocks,
            BlocksModels.Block.toShareable,
        );

        return #ok({
            page = BlocksModels.Block.toShareable(page);
            _records = {
                blocks = List.toArray(shareableBlocks);
            };
        });
    };

    public query ({ caller }) func pages(options : PagesOptionsArg) : async PagesResult {
        let { cursor; limit; order } = options;
        let pages = state.data.getPages(cursor, limit, order);
        let result = {
            edges = List.toArray(
                List.map(
                    pages,
                    func(block : BlocksTypes.Block) : CoreTypes.Edge<ShareableBlock> {
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
        await updateCanistergeekInformation({ metrics = ? #normal });
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
        await updateCanistergeekInformation({ metrics = ? #normal });
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
        await updateCanistergeekInformation({ metrics = ? #normal });
        return finalResult;
    };

    public shared ({ caller }) func deletePage(
        input : Types.Updates.DeletePageUpdate.DeletePageUpdateInput
    ) : async Types.Updates.DeletePageUpdate.DeletePageUpdateOutput {
        let result = #ok(state.data.deleteBlockByUuid(input.uuid));
        await updateCanistergeekInformation({ metrics = ? #normal });
        return result;
    };

    public shared ({ caller }) func saveEvents(
        input : Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput
    ) : async Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput {
        for (event in input.transaction.vals()) {
            state.data.Event.objects.upsert(event);
            processEvent(event);
        };

        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok();
    };

    func processEvent(event : BlockEvent) : () {
        canistergeekLogger.logMessage("Received event: " # debug_show event);

        switch (event.data) {
            case (#blockCreated(blockCreatedEvent)) {
                canistergeekLogger.logMessage("Processing blockCreated event: " # debug_show (event.uuid));

                BlockCreatedConsumer.execute(state, { event with data = blockCreatedEvent }, { uuidGenerator });

                canistergeekLogger.logMessage("Processed blockCreated event: " # debug_show UUID.toText(event.uuid));
            };
            case (#blockUpdated(blockUpdatedEvent)) {
                canistergeekLogger.logMessage(
                    "Processing blockUpdated event: "
                    # debug_show (event.uuid)
                    # "\n"
                    # debug_show event
                );

                let res = BlockUpdatedConsumer.execute(state, { event with data = blockUpdatedEvent }, { uuidGenerator });
                let uuid = event.uuid;

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
    };

    // Returns the cycles received up to the capacity allowed
    public shared func walletReceive() : async { accepted : Nat64 } {
        let result = await CyclesUtils.walletReceive(capacity - ExperimentalCycles.balance());
        await updateCanistergeekInformation({ metrics = ? #normal });
        return result;
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
    ) : async Canistergeek.GetInformationResponse {
        Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request);
    };

    /**
     * Updates canister information based on passed parameters at current time.
     * Called from browser or any canister "update" method.
     */
    public shared ({ caller }) func updateCanistergeekInformation(
        request : Canistergeek.UpdateInformationRequest
    ) : async () {
        canistergeekMonitor.updateInformation(request);
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

        ignore Timer.recurringTimer(
            #seconds(1),
            uuidGenerator.generateIds,
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
