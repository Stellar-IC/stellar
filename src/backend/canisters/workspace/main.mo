import Array "mo:base/Array";
import Debug "mo:base/Debug";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import Time = "mo:base/Time";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";

import Canistergeek "mo:canistergeek/canistergeek";

import UUID "mo:uuid/UUID";

import ActivitiesTypes "../../lib/activities/types";
import BlockModule "../../lib/blocks/block";
import BlocksTypes "../../lib/blocks/types";
import BlockEvent "../../lib/events/block_event";
import EventStream "../../lib/events/event_stream";
import Paginator "../../lib/pagination/paginator";
import Logger "../../lib/logger";
import PubSub "../../lib/pub_sub";
import UserRegistry "../../lib/user_registry";

import CoreTypes "../../types";

import CyclesUtils "../../utils/cycles";

import BlockCreatedConsumer "./consumers/block_created_consumer";
import BlockUpdatedConsumer "./consumers/block_updated_consumer";
import CreatePage "./services/create_page";
import State "./state";
import Types "./types/v2";

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
    type PagesOutput = Types.Queries.Pages.PagesOutput;
    type PrimaryKey = Types.PrimaryKey;
    type WorkspaceUser = Types.WorkspaceUser;
    type WorkspaceOwner = Types.WorkspaceOwner;

    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type BlockEvent = BlocksTypes.BlockEvent;

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var _activitiesIdCounter : Nat = 0;
    stable var _events : RBTree.Tree<Text, BlockEvent> = #leaf;

    stable var _owner : WorkspaceOwner = initArgs.owner;
    stable var _uuid : UUID.UUID = initData.uuid;
    stable var _name : CoreTypes.Workspaces.WorkspaceName = initData.name;
    stable var _description : CoreTypes.Workspaces.WorkspaceDescription = initData.name;
    stable var _websiteLink : ?Text = null;
    stable var _visibility : Types.WorkspaceVisibility = #Private;
    stable var _createdAt : Time.Time = initData.createdAt;
    stable var _updatedAt : Time.Time = initData.updatedAt;

    stable var _userIndexCanisterId : Principal = initArgs.userIndexCanisterId;
    stable let _capacity : Nat = initArgs.capacity;
    stable var _balance : Nat = ExperimentalCycles.balance();

    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var _canistergeekLoggerUD : ?Canistergeek.LoggerUpgradeData = null;
    stable var _userRegistryUpgradeData : RBTree.Tree<Principal, WorkspaceUser> = #leaf;
    stable var _eventStreamUpgradeData : ?EventStream.UpgradeData<BlocksTypes.BlockEvent> = null;

    stable var _state = State.init();

    let canistergeekMonitor = Canistergeek.Monitor();
    let canistergeekLogger = Canistergeek.Logger();
    let logger = Logger.Logger([
        Logger.CanisterGeekLoggerAdapter(canistergeekLogger),
        Logger.DebugLoggerAdapter(),
    ]);

    let userRegistry = UserRegistry.UserRegistry<WorkspaceUser>();
    let eventStream = EventStream.EventStream<BlocksTypes.BlockEvent>(
        {
            getEventId = func(event) {
                UUID.toText(BlockEvent.getId(event));
            };
        },
        { logger },
    );

    /*************************************************************************
     * Initialization helper methods
     *************************************************************************/

    public query ({ caller }) func getInitArgs() : async Types.Queries.GetInitArgs.GetInitArgsOutput {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        return #ok(initArgs);
    };

    public query ({ caller }) func getInitData() : async Types.Queries.GetInitData.GetInitDataOutput {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        return #ok(initData);
    };

    /*************************************************************************
     * Queries
     *************************************************************************/

    public query func toObject() : async CoreTypes.Workspaces.Workspace {
        return {
            uuid = _uuid;
            name = _name;
            description = _description;
            owner = _owner;
            createdAt = _createdAt;
            updatedAt = _updatedAt;
        };
    };

    public query func block(
        uuid : UUID.UUID,
        options : Types.Queries.BlockByUuid.BlockByUuidOptions,
    ) : async Types.Queries.BlockByUuid.BlockByUuidResult {
        let blockId = UUID.toText(uuid);
        let block = switch (State.findBlock(_state, blockId)) {
            case (null) { return #err(#notFound) };
            case (?block) { block };
        };
        let contentBlocks = List.toArray(State.getContentForBlock(_state, blockId, options.contentPagination));
        var blockRecords = List.fromArray<(Text, ShareableBlock)>([]);

        for (contentBlock in Array.vals(contentBlocks)) {
            blockRecords := List.append(blockRecords, List.fromArray([(UUID.toText(contentBlock.uuid), BlockModule.toShareable(contentBlock))]));
        };

        blockRecords := List.append(blockRecords, List.fromArray([(UUID.toText(block.uuid), BlockModule.toShareable(block))]));

        return #ok({
            block = blockId;
            recordMap = {
                blocks = List.toArray(blockRecords);
            };
        });
    };

    public query ({ caller }) func pages(options : PagesOptionsArg) : async PagesOutput {
        let pages = State.getPages(_state);
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
            let pageFromState = State.findBlock(_state, pageId);
            let pageContent = List.toArray(State.getContentForBlock(_state, pageId, contentOptions));
            let pageRecord = (pageId, page);

            blockRecords := List.append(blockRecords, List.fromArray([pageRecord]));

            for (block in Array.vals(pageContent)) {
                let record = (UUID.toText(block.uuid), BlockModule.toShareable(block));
                blockRecords := List.append(blockRecords, List.fromArray([record]));
            };
        };

        let result : PagesOutput = {
            pages = {
                edges = List.toArray(
                    List.map<BlocksTypes.ShareableBlock, CoreTypes.Edge<Text>>(
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

    public query func activityLog(
        pageUuid : UUID.UUID
    ) : async Types.Queries.ActivityLog.ActivityLogOutput {
        var activities = List.fromArray<ActivitiesTypes.HydratedActivity>([]);

        for (activity in List.toIter(State.getActivitiesForPage(_state, UUID.toText(pageUuid)))) {
            var edits = List.fromArray<ActivitiesTypes.HydratedEditItem>([]);
            var users = List.fromArray<ActivitiesTypes.HydratedEditItemUser>([]);

            for (edit in activity.edits.vals()) {
                let user = UserRegistry.getUser(userRegistry, edit.user);
                let hydratedEdit = {
                    edit with user = {
                        canisterId = user.canisterId;
                        username = user.username;
                    };
                };

                edits := List.append(edits, List.fromArray([hydratedEdit]));

                // Add user to the list if it's not already there
                if (
                    List.some<ActivitiesTypes.HydratedEditItemUser>(
                        users,
                        func(u) { u.canisterId == user.canisterId },
                    ) == false
                ) {
                    users := List.push<ActivitiesTypes.HydratedEditItemUser>(
                        {
                            canisterId = user.canisterId;
                            username = user.username;
                        },
                        users,
                    );
                };
            };

            activities := List.push<ActivitiesTypes.HydratedActivity>(
                {
                    activity with edits = List.toArray(edits);
                    users = List.toArray(users);
                },
                activities,
            );
        };

        return Paginator.paginateList(activities);
    };

    public query func members() : async Types.Queries.Members.MembersOutput {
        let _users = UserRegistry.getUsers(userRegistry);
        let userCount = Array.size(_users);
        let users = Buffer.Buffer<(Principal, WorkspaceUser)>(userCount);
        let userIds = Buffer.Buffer<Principal>(userCount);

        for (user in Array.vals(_users)) {
            users.add((user.canisterId, user));
            userIds.add(user.canisterId);
        };

        return {
            users = Paginator.paginateBuffer(userIds);
            recordMap = { users = Buffer.toArray(users) };
        };
    };

    public query func settings() : async Types.Queries.Settings.SettingsOutput {
        return {
            description = _description;
            name = _name;
            visibility = _visibility;
            websiteLink = switch (_websiteLink) {
                case (null) { "" };
                case (?link) { link };
            };
        };
    };

    /*************************************************************************
     * Updates
     *************************************************************************/
    public shared ({ caller }) func join() : async Result.Result<(), { #unauthorized; #profileQueryFailure; #userUpdateFailure }> {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        let UserIndex = actor (Principal.toText(_userIndexCanisterId)) : actor {
            userId : (Principal) -> async Principal;
        };
        let userId = await UserIndex.userId(caller);
        let user = actor (Principal.toText(userId)) : actor {
            publicProfile : (Principal) -> async Result.Result<CoreTypes.User.PublicUserProfile, { #unauthorized }>;
            addWorkspace({ canisterId : Principal }) : async Result.Result<[CoreTypes.Workspaces.WorkspaceId], { #unauthorized }>;
        };
        let profileResult = await user.publicProfile(caller);
        let username = switch (profileResult) {
            case (#err(_)) {
                return #err(#profileQueryFailure);
            };
            case (#ok(profile)) { profile.username };
        };

        UserRegistry.addUser<WorkspaceUser>(
            userRegistry,
            caller,
            userId,
            {
                canisterId = userId;
                role = #member;
                username;
                identity = caller;
            },
        );

        switch (await user.addWorkspace({ canisterId = Principal.fromActor(self) })) {
            case (#err(_)) {
                return #err(#userUpdateFailure);
            };
            case (#ok(_)) {};
        };

        return #ok;
    };

    public shared ({ caller }) func addUsers(
        input : Types.Updates.AddUsersUpdate.AddUsersUpdateInput
    ) : async Types.Updates.AddUsersUpdate.AddUsersUpdateResult {
        if (caller != _owner) {
            return #err(#unauthorized);
        };

        for (item in input.vals()) {
            let userIdentity = item.0;
            let userDetails = item.1;
            let userCanisterId = userDetails.canisterId;

            UserRegistry.addUser<WorkspaceUser>(
                userRegistry,
                userIdentity,
                userCanisterId,
                userDetails,
            );
        };

        return #ok;
    };

    public shared ({ caller }) func createPage(
        input : Types.Updates.CreatePageUpdate.CreatePageUpdateInput
    ) : async Types.Updates.CreatePageUpdate.CreatePageUpdateOutput {
        let result = CreatePage.execute(_state, caller, input);
        await updateCanistergeekInformation({ metrics = ? #force });

        return result;
    };

    public shared ({ caller }) func addBlock(
        input : Types.Updates.AddBlockUpdate.AddBlockUpdateInput
    ) : async Types.Updates.AddBlockUpdate.AddBlockUpdateOutput {
        let block = BlockModule.fromShareableUnsaved(input);
        ignore State.addBlock(_state, block);
        await updateCanistergeekInformation({ metrics = ? #force });

        return #ok;
    };

    public shared ({ caller }) func updateBlock(
        input : Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateInput
    ) : async Types.Updates.UpdateBlockUpdate.UpdateBlockUpdateOutput {
        let block = BlockModule.fromShareable(input);
        let result = State.updateBlock(_state, block);
        await updateCanistergeekInformation({ metrics = ? #force });

        return #ok(BlockModule.toShareable(block));
    };

    public shared ({ caller }) func deletePage(
        input : Types.Updates.DeletePageUpdate.DeletePageUpdateInput
    ) : async Types.Updates.DeletePageUpdate.DeletePageUpdateOutput {
        State.deleteBlock(_state, UUID.toText(input.uuid));
        await updateCanistergeekInformation({ metrics = ? #force });

        return #ok;
    };

    public shared ({ caller }) func saveEvents(
        input : Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateInput
    ) : async Types.Updates.SaveEventTransactionUpdate.SaveEventTransactionUpdateOutput {
        for (event in input.transaction.vals()) {
            // TODO: Save events to state
            processEvent(event);
        };

        await updateCanistergeekInformation({ metrics = ? #force });

        return #ok;
    };

    public shared ({ caller }) func updateSettings(
        input : Types.Updates.UpdateSettingsUpdate.UpdateSettingsUpdateInput
    ) : async Types.Updates.UpdateSettingsUpdate.UpdateSettingsUpdateOutput {
        let user = UserRegistry.findUser(userRegistry, caller);

        // Check if the caller is an admin
        switch (user) {
            case (null) {
                return #err(#unauthorized);
            };
            case (?user) {
                if (user.role != #admin) {
                    return #err(#unauthorized);
                };
            };
        };

        switch (input.name) {
            case (null) {};
            case (?name) {
                // TODO: Name should be unique
                _name := name;
                ignore publish(
                    "workspaceNameUpdated",
                    #workspaceNameUpdated({
                        workspaceId = Principal.fromActor(self);
                        name = _name;
                    }),
                );
            };
        };

        switch (input.description) {
            case (null) {};
            case (?description) {
                _description := description;
            };
        };

        switch (input.websiteLink) {
            case (null) {};
            case (?websiteLink) {
                _websiteLink := ?websiteLink;
            };
        };

        switch (input.visibility) {
            case (null) {};
            case (?visibility) {
                _visibility := visibility;
            };
        };

        await updateCanistergeekInformation({ metrics = ? #force });

        return #ok;
    };

    public shared ({ caller }) func updateUserRole(
        input : Types.Updates.UpdateUserRoleUpdate.UpdateUserRoleUpdateInput
    ) : async Types.Updates.UpdateUserRoleUpdate.UpdateUserRoleUpdateOutput {
        let user = UserRegistry.getUserByUserId(userRegistry, input.user);
        let updatedUser = {
            user with role = input.role;
        };
        let adminUsers = UserRegistry.filter<WorkspaceUser>(userRegistry, func(u : WorkspaceUser) { u.role == #admin });

        // Is this the only admin user in the workspace?
        // If so, don't allow the role to be changed
        if (
            Array.size(adminUsers) == 1 and
            user.role == #admin and
            updatedUser.role != #admin
        ) {
            // TODO: Consider returning a more specific error
            return #err(#unauthorized);
        };

        UserRegistry.updateUser<WorkspaceUser>(userRegistry, input.user, updatedUser);

        await updateCanistergeekInformation({ metrics = ? #force });

        return #ok;
    };

    func processEvent(event : BlockEvent) : () {
        let activityId = _activitiesIdCounter;

        switch (event.data) {
            case (#blockCreated(blockCreatedEvent)) {
                logger.info("Processing blockCreated event: " # debug_show UUID.toText(event.uuid));
                let res = BlockCreatedConsumer.execute(_state, { event with data = blockCreatedEvent }, activityId);
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
                let res = BlockUpdatedConsumer.execute(_state, { event with data = blockUpdatedEvent }, activityId);
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

        _activitiesIdCounter := _activitiesIdCounter + 1;
    };

    // Returns the cycles received up to the capacity allowed
    public shared func walletReceive() : async { accepted : Nat64 } {
        let result = await CyclesUtils.walletReceive(_capacity - ExperimentalCycles.balance());
        await updateCanistergeekInformation({ metrics = ? #force });

        return result;
    };

    /*************************************************************************
     * PubSub
     *************************************************************************/
    type PubSubEvent = Types.PubSubEvent;
    type PubSubEventHandler = Types.PubSubEventHandler;

    stable let _publisher = PubSub.Publisher<PubSubEvent, PubSubEventHandler>();

    public shared ({ caller }) func subscribe(eventName : Text, handler : PubSubEventHandler) : async () {
        PubSub.subscribe(_publisher, caller, eventName, handler);
    };

    private func publish(eventName : Text, payload : PubSubEvent) : async () {
        await PubSub.publish(
            _publisher,
            eventName,
            payload,
            func(handler : PubSubEventHandler, eventName : Text, payload : PubSubEvent) : async () {
                ignore handler(eventName, payload);
            },
        );
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

    private func doCanisterGeekPreUpgrade() {
        _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
        _canistergeekLoggerUD := ?canistergeekLogger.preupgrade();
    };

    private func doCanisterGeekPostUpgrade() {
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        _canistergeekMonitorUD := null;

        canistergeekLogger.postupgrade(_canistergeekLoggerUD);
        _canistergeekLoggerUD := null;

        canistergeekLogger.setMaxMessagesCount(500);
    };

    /*************************************************************************
     * System Functions
     *************************************************************************/

    system func preupgrade() {
        doCanisterGeekPreUpgrade();
        _eventStreamUpgradeData := ?eventStream.preupgrade();
        _userRegistryUpgradeData := userRegistry.preupgrade();
    };

    system func postupgrade() {
        doCanisterGeekPostUpgrade();

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
