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
import Iter "mo:base/Iter";

import Canistergeek "mo:canistergeek/canistergeek";
import StableBuffer "mo:stablebuffer/StableBuffer";
import UUID "mo:uuid/UUID";
import Map "mo:map/Map";

import ActivitiesTypes "../../lib/activities/types";
import BlockModule "../../lib/blocks/block";
import BlocksTypes "../../lib/blocks/types";
import BlockEvent "../../lib/events/block_event";
import EventStream "../../lib/events/event_stream";
import Paginator "../../lib/pagination/paginator";
import Logger "../../lib/logger";
import PubSub "../../lib/pub_sub";
import UserRegistry "../../lib/user_registry";
import UserRegistryV2 "../../lib/user_registry_v2";

import CoreTypes "../../types";

import CyclesUtils "../../utils/cycles";

import BlockCreatedConsumer "./consumers/block_created_consumer";
import BlockUpdatedConsumer "./consumers/block_updated_consumer";
import Migration001ConvertUserRegistryToStableMap "./migrations/001_convert_user_registry_to_stable_map";
import PageAccessManager "./page_access_manager";
import CreatePage "./services/create_page";
import State "./state";
import Types "./types/v2";

shared ({ caller = initializer }) actor class Workspace(
    initArgs : CoreTypes.Workspaces.WorkspaceInitArgs
) = self {
    /*************************************************************************
     * Types
     *************************************************************************/

    type BlockUserRole = Types.BlockUserRole;
    type PrimaryKey = Types.PrimaryKey;
    type WorkspaceUser = Types.WorkspaceUser;
    type WorkspaceOwner = Types.WorkspaceOwner;

    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type BlockEvent = BlocksTypes.BlockEvent;

    type UserActor = actor {
        publicProfile : (Principal) -> async Result.Result<CoreTypes.User.PublicUserProfile, { #unauthorized }>;
        addWorkspace({ canisterId : Principal }) : async Result.Result<[CoreTypes.Workspaces.WorkspaceId], { #unauthorized }>;
    };

    /*************************************************************************
     * Stable Data
     *************************************************************************/

    stable var _name : CoreTypes.Workspaces.WorkspaceName = initArgs.name;
    stable var _description : CoreTypes.Workspaces.WorkspaceDescription = initArgs.description;
    stable var _websiteLink : ?Text = null;
    stable var _visibility : Types.WorkspaceVisibility = #Private;
    stable var _createdAt : Time.Time = initArgs.createdAt;
    stable var _updatedAt : Time.Time = initArgs.updatedAt;

    stable var _userIndexCanisterId : Principal = initArgs.userIndexCanisterId;
    stable let _capacity : Nat = initArgs.capacity;
    stable var _balance : Nat = ExperimentalCycles.balance();

    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var _canistergeekLoggerUD : ?Canistergeek.LoggerUpgradeData = null;
    stable var _eventStreamUpgradeData : ?EventStream.UpgradeData<BlocksTypes.BlockEvent> = null;

    stable var _state = State.init();
    stable var _users = UserRegistryV2.UserRegistry<WorkspaceUser>();
    stable var _owners = StableBuffer.fromArray<WorkspaceOwner>(initArgs.owners);
    stable var _events : RBTree.Tree<Text, BlockEvent> = #leaf;
    stable var _pageAccessManager = PageAccessManager.PageAccessManager();

    stable var _activitiesIdCounter : Nat = 0;

    /*************************************************************************
     * Transient Data
     *************************************************************************/

    let canistergeekMonitor = Canistergeek.Monitor();
    let canistergeekLogger = Canistergeek.Logger();
    let logger = Logger.Logger([
        Logger.CanisterGeekLoggerAdapter(canistergeekLogger),
        Logger.DebugLoggerAdapter(),
    ]);

    let eventStream = EventStream.EventStream<BlocksTypes.BlockEvent>(
        {
            getEventId = func(event) {
                UUID.toText(BlockEvent.getId(event));
            };
        },
        { logger },
    );

    /* deprecated - use _users instead */
    let userRegistry = UserRegistry.UserRegistry<WorkspaceUser>();
    stable var _userRegistryUpgradeData : RBTree.Tree<Principal, WorkspaceUser> = #leaf;
    userRegistry.postupgrade(_userRegistryUpgradeData);

    /*************************************************************************
     * Migrations
     *************************************************************************/

    // Copy all users from the old user registry to the new one
    Migration001ConvertUserRegistryToStableMap.up(
        userRegistry,
        _users,
    );

    /*************************************************************************
     * Helpers
     *************************************************************************/

    private func isOwner(caller : Principal) : Bool {
        StableBuffer.contains(_owners, caller, Principal.equal);
    };

    private func _pageAccessSettings(
        pageId : UUID.UUID
    ) : Types.Queries.PageAccessSettings.PageAccessSettingsOutput {
        let pageIdText = UUID.toText(pageId);
        let page = switch (State.findBlock(_state, pageIdText)) {
            case (null) { return PageAccessManager.defaultAccessSetting };
            case (?page) { page };
        };
        var accessSetting = PageAccessManager.get(_pageAccessManager, pageIdText);

        switch (accessSetting) {
            case (null) {
                // Find the first page with an access setting
                for (ancestorPage in State.getAncestorPages(_state, page)) {
                    accessSetting := ?_pageAccessSettings(ancestorPage.uuid);

                    switch (accessSetting) {
                        case (null) {};
                        case (?setting) {
                            return setting;
                        };
                    };
                };

                return PageAccessManager.defaultAccessSetting;
            };
            case (?setting) { return setting };
        };
    };

    private func getUserAccessLevel(
        caller : Principal,
        pageId : UUID.UUID,
    ) : Types.PageAccessLevel {
        let pageIdText = UUID.toText(pageId);
        let user = UserRegistry.findUser(userRegistry, caller);
        let page = switch (State.findBlock(_state, pageIdText)) {
            case (null) { null };
            case (?page) { ?page };
        };
        let pageAccessSetting = _pageAccessSettings(pageId);

        switch (user) {
            case (null) { return #none };
            case (?user) {
                let isMember = switch (user.role) {
                    case (#admin) { true };
                    case (#guest) { false };
                    case (#member) { true };
                    case (#moderator) { true };
                };

                return PageAccessManager.getUserAccessLevel(
                    _pageAccessManager,
                    pageIdText,
                    caller,
                    isMember,
                );
            };
        };
    };

    private func userHasViewAccess(
        caller : Principal,
        blockId : UUID.UUID,
    ) : Bool {
        let accessLevel = getUserAccessLevel(caller, blockId);

        switch (accessLevel) {
            case (#none) { false };
            case (#view) { true };
            case (#edit) { true };
            case (#full) { true };
        };
    };

    /*************************************************************************
     * Queries
     *************************************************************************/

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

    public query ({ caller }) func block(
        blockId : UUID.UUID,
        options : Types.Queries.BlockByUuid.BlockByUuidOptions,
    ) : async Types.Queries.BlockByUuid.BlockByUuidResult {
        let blockIdText = UUID.toText(blockId);
        let block = switch (State.findBlock(_state, blockIdText)) {
            case (null) { return #err(#notFound) };
            case (?block) { block };
        };

        // Check if the user has access to view the block
        if (block.blockType == #page) {
            let canView = userHasViewAccess(caller, blockId);
            if (not canView) { return #err(#notFound) };
        };

        let contentBlocks = State.getContentForBlock(_state, blockIdText, options.contentPagination);
        var blockRecords = Buffer.fromArray<(Text, ShareableBlock)>([]);

        blockRecords.add((blockIdText, BlockModule.toShareable(block)));

        label contentLoop for (contentBlock in contentBlocks) {
            // Check if the user has access to view the block
            if (block.blockType == #page) {
                let canView = userHasViewAccess(caller, blockId);
                if (not canView) { continue contentLoop };
            };

            let contentBlockId = UUID.toText(contentBlock.uuid);
            let record = (contentBlockId, BlockModule.toShareable(contentBlock));
            blockRecords.add(record);
        };

        return #ok({
            block = blockIdText;
            recordMap = {
                blocks = Buffer.toArray(blockRecords);
            };
        });
    };

    public query func members() : async Types.Queries.Members.MembersOutput {
        let users = UserRegistryV2.getUsers(_users);
        let userCount = Array.size(users);
        let usersBuffer = Buffer.Buffer<(Principal, WorkspaceUser)>(userCount);
        let userIds = Buffer.Buffer<Principal>(userCount);

        for (user in Array.vals(users)) {
            usersBuffer.add((user.canisterId, user));
            userIds.add(user.canisterId);
        };

        return {
            users = Paginator.paginateBuffer(userIds);
            recordMap = { users = Buffer.toArray(usersBuffer) };
        };
    };

    public query ({ caller }) func pageAccessSettings(
        pageId : UUID.UUID
    ) : async Types.Queries.PageAccessSettings.PageAccessSettingsOutput {
        _pageAccessSettings(pageId);
    };

    public query ({ caller }) func pages(
        options : Types.Queries.Pages.PagesOptionsArg
    ) : async Types.Queries.Pages.PagesOutput {
        let pages = Iter.toArray(State.getPages(_state));
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

        label pageLoop for (page in Array.vals(pages)) {
            let canViewPage = userHasViewAccess(caller, page.uuid);

            if (not canViewPage) {
                continue pageLoop;
            };

            let pageId = UUID.toText(page.uuid);
            let pageFromState = State.findBlock(_state, pageId);
            let pageContent = State.getContentForBlock(
                _state,
                pageId,
                contentOptions,
            );
            let pageRecord = (pageId, page);

            blockRecords := List.append(blockRecords, List.fromArray([pageRecord]));

            label contentLoop for (block in pageContent) {
                if (block.blockType == #page) {
                    let canView = userHasViewAccess(caller, block.uuid);
                    if (not canView) { continue contentLoop };
                };

                let record = (UUID.toText(block.uuid), BlockModule.toShareable(block));
                blockRecords := List.append(blockRecords, List.fromArray([record]));
            };
        };

        return {
            pages = {
                edges = Array.map<BlocksTypes.ShareableBlock, CoreTypes.Edge<Text>>(
                    pages,
                    func(block) {
                        { node = UUID.toText(block.uuid) };
                    },
                );
            };
            recordMap = {
                blocks = List.toArray(blockRecords);
            };
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

    public query func toObject() : async CoreTypes.Workspaces.Workspace {
        return {
            name = _name;
            description = _description;
            owners = _owners;
            createdAt = _createdAt;
            updatedAt = _updatedAt;
        };
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    public shared ({ caller }) func join() : async Result.Result<(), { #unauthorized; #profileQueryFailure; #userUpdateFailure }> {
        let UserIndex = actor (Principal.toText(_userIndexCanisterId)) : actor {
            userDetailsByIdentity : (Principal) -> async Result.Result<{ canisterId : Principal; username : Text }, { #notFound }>;
        };
        let result = await UserIndex.userDetailsByIdentity(caller);
        let { canisterId; username } = switch (result) {
            case (#err(_)) {
                return #err(#profileQueryFailure);
            };
            case (#ok(userDetails)) { userDetails };
        };
        let user = actor (Principal.toText(canisterId)) : UserActor;

        // TODO: Remove once userRegistry is fully replaced
        UserRegistry.addUser<WorkspaceUser>(
            userRegistry,
            caller,
            canisterId,
            {
                canisterId;
                role = #member;
                username;
                identity = caller;
            },
        );

        UserRegistryV2.addUser<WorkspaceUser>(
            _users,
            caller,
            canisterId,
            {
                canisterId;
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

    public shared ({ caller }) func addOwner(owner : Principal) : async Result.Result<(), { #unauthorized; #userUpdateFailure }> {
        if (not isOwner(caller)) {
            return #err(#unauthorized);
        };

        if (StableBuffer.contains(_owners, owner, Principal.equal)) {
            return #ok;
        };

        StableBuffer.add<Principal>(_owners, owner);

        #ok;
    };

    public shared ({ caller }) func removeOwner(owner : Principal) : async Result.Result<(), { #unauthorized; #userUpdateFailure }> {
        if (not isOwner(caller)) {
            return #err(#unauthorized);
        };

        if (not StableBuffer.contains(_owners, owner, Principal.equal)) {
            return #ok;
        };

        if (StableBuffer.size(_owners) == 1) {
            return #err(#unauthorized);
        };

        StableBuffer.filterEntries<Principal>(
            _owners,
            func(_, entry) {
                entry != owner;
            },
        );

        return #ok;
    };

    public shared ({ caller }) func addUsers(
        input : Types.Updates.AddUsers.AddUsersInput
    ) : async Types.Updates.AddUsers.AddUsersResult {
        if (not isOwner(caller)) {
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
        input : Types.Updates.CreatePage.CreatePageInput
    ) : async Types.Updates.CreatePage.CreatePageOutput {
        let result = CreatePage.execute(_state, caller, input);

        await updateCanistergeekInformation({ metrics = ? #force });

        return result;
    };

    public shared ({ caller }) func addBlock(
        input : Types.Updates.AddBlock.AddBlockInput
    ) : async Types.Updates.AddBlock.AddBlockOutput {
        let block = BlockModule.fromShareableUnsaved(input);
        ignore State.addBlock(_state, block);
        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok;
    };

    public shared ({ caller }) func updateBlock(
        input : Types.Updates.UpdateBlock.UpdateBlockInput
    ) : async Types.Updates.UpdateBlock.UpdateBlockOutput {
        let block = BlockModule.fromShareable(input);
        let result = State.updateBlock(_state, block);
        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok(BlockModule.toShareable(block));
    };

    public shared ({ caller }) func deletePage(
        input : Types.Updates.DeletePage.DeletePageInput
    ) : async Types.Updates.DeletePage.DeletePageOutput {
        State.deleteBlock(_state, UUID.toText(input.uuid));
        //  TODO: Delete all blocks in the page
        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok;
    };

    public shared ({ caller }) func saveEvents(
        input : Types.Updates.SaveEventTransaction.SaveEventTransactionInput
    ) : async Types.Updates.SaveEventTransaction.SaveEventTransactionOutput {
        for (event in input.transaction.vals()) {
            processEvent(event);
        };

        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok;
    };

    public shared ({ caller }) func updateSettings(
        input : Types.Updates.UpdateSettings.UpdateSettingsInput
    ) : async Types.Updates.UpdateSettings.UpdateSettingsOutput {
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

        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok;
    };

    public shared ({ caller }) func updateUserRole(
        input : Types.Updates.UpdateUserRole.UpdateUserRoleInput
    ) : async Types.Updates.UpdateUserRole.UpdateUserRoleOutput {
        let user = UserRegistry.getUserByUserId(userRegistry, input.user);
        let updatedUser = { user with role = input.role };
        let adminUsers = UserRegistry.filter<WorkspaceUser>(userRegistry, func(u : WorkspaceUser) { u.role == #admin });

        // Is this the only admin user in the workspace?
        // If so, prevent the role from being changed
        if (
            Array.size(adminUsers) == 1 and
            user.role == #admin and
            updatedUser.role != #admin
        ) {
            // TODO: Consider returning a more specific error
            return #err(#unauthorized);
        };

        UserRegistry.updateUser<WorkspaceUser>(userRegistry, input.user, updatedUser);

        await updateCanistergeekInformation({ metrics = ? #normal });

        return #ok;
    };

    public shared ({ caller }) func setPageAccessSettings(
        input : Types.Updates.SetPageAccess.SetPageAccessInput
    ) : async Types.Updates.SetPageAccess.SetPageAccessOutput {
        let pageId = UUID.toText(input.pageId);
        PageAccessManager.set(_pageAccessManager, pageId, input.access);
        await updateCanistergeekInformation({ metrics = ? #normal });

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

    /*************************************************************************
     * Cycles Management
     *************************************************************************/

    // Returns the cycles received up to the capacity allowed
    public shared func walletReceive() : async { accepted : Nat64 } {
        let result = await CyclesUtils.walletReceive(_capacity - ExperimentalCycles.balance());
        await updateCanistergeekInformation({ metrics = ? #normal });

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

    public shared ({ caller }) func unsubscribe(eventName : Text, handler : PubSubEventHandler) : async () {
        PubSub.unsubscribe<PubSubEvent, PubSubEventHandler>(
            _publisher,
            caller,
            eventName,
        );
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

    public query ({ caller }) func getCanistergeekInformation(
        request : Canistergeek.GetInformationRequest
    ) : async Canistergeek.GetInformationResponse {
        Canistergeek.getInformation(?canistergeekMonitor, ?canistergeekLogger, request);
    };

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
    };
};
