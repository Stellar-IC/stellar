import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
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
import Source "mo:uuid/async/SourceV4";

import Activity "../../lib/activities/Activity";
import ActivityBuilder "../../lib/activities/ActivityBuilder";
import ActivitiesTypes "../../lib/activities/types";
import BlockBuilder "../../lib/blocks/BlockBuilder";
import BlockModule "../../lib/blocks/Block";
import BlocksTypes "../../lib/blocks/types";
import BlockEvent "../../lib/events/BlockEvent";
import EventStream "../../lib/events/EventStream";
import Paginator "../../lib/pagination/Paginator";
import Logger "../../lib/Logger";
import UserRegistry "../../lib/UserRegistry";

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

    stable var _stateUpgradeData : ?State.UpgradeData = null;
    stable var blocks : RBTree.Tree<PrimaryKey, ShareableBlock> = #leaf;
    stable var activitiesIdCounter : Nat = 0;
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

    private let logger = Logger.Logger([
        Logger.CanisterGeekLoggerAdapter(canistergeekLogger),
        Logger.DebugLoggerAdapter(),
    ]);

    type UserRegistryEntry = {
        membershipStatus : {
            isActive : Bool;
        };
        profile : CoreTypes.User.PublicUserProfile;
    };

    private let userRegistry = UserRegistry.UserRegistry<UserRegistryEntry>();
    private stable var _userRegistryUpgradeData : RBTree.Tree<Principal, UserRegistryEntry> = #leaf;

    // Event Stream
    let eventStream = EventStream.EventStream<BlocksTypes.BlockEvent>(
        {
            getEventId = func(event) {
                UUID.toText(BlockEvent.getId(event));
            };
        },
        { logger },
    );
    stable var _eventStreamUpgradeData : ?EventStream.UpgradeData<BlocksTypes.BlockEvent> = null;

    /*************************************************************************
     * Transient Data
     *************************************************************************/

    var timersHaveBeenStarted = false;
    var state = State.State(State.Data());

    /*************************************************************************
     * Initialization helper methods
     *************************************************************************/

    public func getInitArgs() : async CoreTypes.Workspaces.WorkspaceInitArgs {
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

    public query func block(
        uuid : UUID.UUID,
        options : {
            contentPagination : {
                cursor : Nat;
                limit : Nat;
            };
        },
    ) : async BlockByUuidResult {
        let blockId = UUID.toText(uuid);
        let block = switch (state.data.findBlock(blockId)) {
            case (null) { return #err(#notFound) };
            case (?block) { block };
        };
        let contentBlocks = List.toArray(state.data.getContentForBlock(blockId, options.contentPagination));
        var blockRecords = List.fromArray<(Text, ShareableBlock)>([]);

        for (contentBlock in Array.vals(contentBlocks)) {
            blockRecords := List.append(blockRecords, List.fromArray([(UUID.toText(contentBlock.uuid), BlockModule.toShareable(block))]));
        };

        blockRecords := List.append(blockRecords, List.fromArray([(UUID.toText(block.uuid), BlockModule.toShareable(block))]));

        return #ok({
            block = blockId;
            recordMap = {
                blocks = List.toArray(blockRecords);
            };
        });
    };

    public query ({ caller }) func pages(options : PagesOptionsArg) : async PagesResult {
        let pages = state.data.getPages();
        let contentOptions = {
            limit = switch (options.limit) {
                case (null) { 10 };
                case (?limit) { limit };
            };
            cursor = switch (options.cursor) {
                case (null) { 0 };
                case (?cursor) { cursor };
            };
        };

        var blockRecords = List.fromArray<(Text, ShareableBlock)>([]);

        for (page in List.toIter(pages)) {
            let pageId = UUID.toText(page.uuid);
            let pageFromState = state.data.findBlock(pageId);
            let pageContent = List.toArray(state.data.getContentForBlock(pageId, contentOptions));
            let pageRecord = (pageId, BlockModule.toShareable(page));

            blockRecords := List.append(blockRecords, List.fromArray([pageRecord]));

            for (block in Array.vals(pageContent)) {
                let record = (UUID.toText(block.uuid), BlockModule.toShareable(block));
                blockRecords := List.append(blockRecords, List.fromArray([record]));
            };
        };

        let result : PagesResult = {
            pages = {
                edges = List.toArray(
                    List.map<BlocksTypes.Block, CoreTypes.Edge<Text>>(
                        pages,
                        func(block) {
                            { node = UUID.toText(block.uuid) };
                        },
                    )
                );
            };
            recordMap = {
                blocks = List.toArray(blockRecords);
            };
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

    public query func activityLog(pageUuid : UUID.UUID) : async CoreTypes.PaginatedResults<ActivitiesTypes.HydratedActivity> {
        var activities = List.fromArray<ActivitiesTypes.HydratedActivity>([]);

        for (activity in List.toIter(state.data.getActivitiesForPage(UUID.toText(pageUuid)))) {
            let shareableActivity = Activity.toShareable(activity);
            var edits = List.fromArray<ActivitiesTypes.HydratedEditItem>([]);
            var users = List.fromArray<ActivitiesTypes.HydratedEditItemUser>([]);

            for (edit in shareableActivity.edits.vals()) {
                let user = UserRegistry.getUser(userRegistry, edit.user);
                let hydratedEdit = { edit with user = user.profile };

                edits := List.append(edits, List.fromArray([hydratedEdit]));

                // Add user to the list if it's not already there
                if (
                    List.some<ActivitiesTypes.HydratedEditItemUser>(
                        users,
                        func(u) { u.canisterId == user.profile.canisterId },
                    ) == false
                ) {
                    users := List.push<ActivitiesTypes.HydratedEditItemUser>(user.profile, users);
                };
            };

            activities := List.push<ActivitiesTypes.HydratedActivity>(
                {
                    shareableActivity with edits = List.toArray(edits);
                    users = List.toArray(users);
                },
                activities,
            );
        };

        return Paginator.paginateList(activities);
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    public shared func addUsers(users : [(Principal, CoreTypes.User.PublicUserProfile)]) : async () {
        for (user in users.vals()) {
            UserRegistry.addUser<UserRegistryEntry>(userRegistry, user.0, { membershipStatus = { isActive = false }; profile = user.1 });
        };
    };

    public shared ({ caller }) func createPage(
        input : Types.Updates.CreatePageUpdate.CreatePageUpdateInput
    ) : async Types.Updates.CreatePageUpdate.CreatePageUpdateOutput {
        let result = await CreatePage.execute(state, caller, input);
        await updateCanistergeekInformation({ metrics = ? #normal });

        return result;
    };

    public shared ({ caller }) func addBlock(
        input : Types.Updates.AddBlockUpdate.AddBlockUpdateInput
    ) : async () {
        let block = BlockModule.fromShareableUnsaved(input);
        state.data.addBlock(block);
        await updateCanistergeekInformation({ metrics = ? #normal });
    };

    public shared ({ caller }) func updateBlock(
        input : Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput
    ) : async Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput {
        let block = BlockModule.fromShareable(input);
        let result = state.data.updateBlock(block);
        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok(BlockModule.toShareable(block));
    };

    public shared ({ caller }) func deletePage(
        input : Types.Updates.DeletePageUpdate.DeletePageUpdateInput
    ) : async Types.Updates.DeletePageUpdate.DeletePageUpdateOutput {
        state.data.deleteBlock(UUID.toText(input.uuid));
        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok();
    };

    public shared ({ caller }) func saveEvents(
        input : Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput
    ) : async Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput {
        for (event in input.transaction.vals()) {
            state.data.Event.objects.upsert(event);
            eventStream.publish(event);
        };

        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok();
    };

    /*************************************************************************
     * Event Handling
     *************************************************************************/

    func startListeningForEvents() : async () {
        eventStream.addEventListener(
            "BlockEventListener",
            func(event : BlockEvent) : () {
                logger.info("Received event: " # BlockEvent.toText(event));
                processEvent(event);
                ();
            },
        );
        ignore Timer.recurringTimer(
            #nanoseconds(100_000),
            func() : async () { eventStream.processEvents() },
        );
    };

    func processEvent(event : BlockEvent) : () {
        let activityId = activitiesIdCounter;

        switch (event.data) {
            case (#blockCreated(blockCreatedEvent)) {
                logger.info("Processing blockCreated event: " # debug_show UUID.toText(event.uuid));
                let res = BlockCreatedConsumer.execute(state, { event with data = blockCreatedEvent }, activityId);
                switch (res) {
                    case (#ok(_)) {
                        logger.info("Processed blockCreated event: " # debug_show UUID.toText(event.uuid));
                    };
                    case (#err(error)) {
                        logger.info("Failed to process blockCreated event: " # debug_show UUID.toText(event.uuid) # "\nError: " # debug_show error);
                    };
                };
            };
            case (#blockUpdated(blockUpdatedEvent)) {
                logger.info("Processing blockUpdated event: " # debug_show UUID.toText(event.uuid));
                let res = BlockUpdatedConsumer.execute(state, { event with data = blockUpdatedEvent }, activityId);
                switch (res) {
                    case (#ok(_)) {
                        logger.info("Processed blockUpdated event: " # debug_show UUID.toText(event.uuid));
                    };
                    case (#err(error)) {
                        logger.info("Failed to process blockUpdated event: " # debug_show UUID.toText(event.uuid) # "\nError: " # debug_show error);
                    };
                };
            };
        };

        activitiesIdCounter := activitiesIdCounter + 1;
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
    ignore Timer.setTimer(
        #seconds(0),
        startListeningForEvents,
    );

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        doCanisterGeekPreUpgrade();
        _stateUpgradeData := ?state.data.preupgrade();
        _eventStreamUpgradeData := ?eventStream.preupgrade();
        _userRegistryUpgradeData := userRegistry.preupgrade();
    };

    system func postupgrade() {
        doCanisterGeekPostUpgrade();

        switch (_stateUpgradeData) {
            case (null) {};
            case (?upgradeData) {
                state.data.postupgrade(upgradeData);
                _stateUpgradeData := null;
            };
        };

        switch (_eventStreamUpgradeData) {
            case (null) {};
            case (?upgradeData) {
                eventStream.postupgrade(upgradeData);
                _eventStreamUpgradeData := null;
            };
        };

        userRegistry.postupgrade(_userRegistryUpgradeData);
    };
};
