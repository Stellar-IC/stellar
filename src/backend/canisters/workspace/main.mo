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
import Timer "mo:base/Timer";

import Canistergeek "mo:canistergeek/canistergeek";
import StableBuffer "mo:stablebuffer/StableBuffer";
import UUID "mo:uuid/UUID";
import Map "mo:map/Map";

import UserTypes "../../canisters/user/types";

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

    type WorkspaceUser = CoreTypes.Workspaces.WorkspaceUser;

    type PrimaryKey = Types.PrimaryKey;
    type WorkspaceOwner = Types.WorkspaceOwner;
    type HydratedBlock = Types.HydratedBlock;

    type Block = BlocksTypes.Block;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type BlockEvent = BlocksTypes.BlockEvent;

    type UserActor = actor {
        publicProfile : (Principal) -> async Result.Result<CoreTypes.User.PublicUserProfile, { #unauthorized }>;
        addWorkspace({ canisterId : Principal }) : async Result.Result<[CoreTypes.Workspaces.WorkspaceId], { #unauthorized }>;
        subscribe : (
            event : UserTypes.UserEventName,
            eventHandler : UserTypes.UserEventSubscription,
        ) -> async ();
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
    ) : Types.PageAccessSetting {
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

    private func isWorkspaceMember(caller : Principal) : Bool {
        let user = UserRegistryV2.findUser(_users, caller);

        switch (user) {
            case (null) { return false };
            case (?user) {
                switch (user.role) {
                    case (#admin) { true };
                    case (#moderator) { true };
                    case (#member) { true };
                    case (#guest) { false };
                };
            };
        };
    };

    private func getUserAccessLevel(
        caller : Principal,
        pageId : UUID.UUID,
    ) : Types.PageAccessLevel {
        let pageIdText = UUID.toText(pageId);
        let pageAccessSetting = _pageAccessSettings(pageId);

        return PageAccessManager.getUserAccessLevel(
            _pageAccessManager,
            pageIdText,
            caller,
            isWorkspaceMember(caller),
        );
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

    private func hydrateBlock(
        caller : Principal,
        block : ShareableBlock,
    ) : HydratedBlock {
        { block with userAccessLevel = getUserAccessLevel(caller, block.uuid) };
    };

    private func addUser(
        identity : Principal,
        canisterId : Principal,
        username : Text,
        role : CoreTypes.Workspaces.WorkspaceUserRole,
    ) {
        // TODO: Remove once userRegistry is fully replaced
        UserRegistry.addUser<WorkspaceUser>(
            userRegistry,
            identity,
            canisterId,
            {
                canisterId;
                role;
                username;
                identity;
            },
        );

        UserRegistryV2.addUser<WorkspaceUser>(
            _users,
            identity,
            canisterId,
            {
                canisterId;
                role;
                username;
                identity;
            },
        );
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
        var blockRecords = Buffer.fromArray<(Text, HydratedBlock)>([]);

        // Add the parent block to the list of blocks to return
        blockRecords.add((
            blockIdText,
            hydrateBlock(caller, BlockModule.toShareable(block)),
        ));

        // Add the content blocks to the list of blocks to return
        label contentLoop for (contentBlock in contentBlocks) {
            // Skip pages that the user doesn't have access to
            if (block.blockType == #page) {
                let canView = userHasViewAccess(caller, blockId);
                if (not canView) { continue contentLoop };
            };

            let contentBlockId = UUID.toText(contentBlock.uuid);
            let record = (
                contentBlockId,
                hydrateBlock(caller, BlockModule.toShareable(contentBlock)),
            );

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
        let setting = _pageAccessSettings(pageId);
        let invitedUsers = PageAccessManager.getInvitedUsers(
            _pageAccessManager,
            UUID.toText(pageId),
        );
        let invitedUsersHydrated = Array.mapFilter<(Principal, Types.PageAccessLevel), { user : WorkspaceUser; access : Types.PageAccessLevel }>(
            invitedUsers,
            func(user) {
                let fullUser = switch (UserRegistryV2.findUser(_users, user.0)) {
                    case (null) { return null };
                    case (?user) { user };
                };

                ?{ user = fullUser; access = user.1 };
            },
        );

        return {
            accessSetting = setting;
            invitedUsers = invitedUsersHydrated;
        };
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
        var blockRecords = Buffer.fromArray<(Text, ShareableBlock)>([]);

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
            let pageRecord = (pageId, hydrateBlock(caller, page));

            blockRecords.add(pageRecord);

            label contentLoop for (block in pageContent) {
                if (block.blockType == #page) {
                    let canView = userHasViewAccess(caller, block.uuid);
                    if (not canView) { continue contentLoop };
                };

                let record = (
                    UUID.toText(block.uuid),
                    hydrateBlock(caller, BlockModule.toShareable(block)),
                );
                blockRecords.add(record);
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
                blocks = Buffer.toArray(blockRecords);
            };
        };
    };

    public query ({ caller }) func settings() : async Result.Result<Types.Queries.Settings.SettingsOutput, { #unauthorized }> {
        // Check if the user is authorized to view the workspace
        if (_visibility == #Private and not isWorkspaceMember(caller)) {
            return #err(#unauthorized);
        };

        return #ok({
            description = _description;
            name = _name;
            visibility = _visibility;
            websiteLink = switch (_websiteLink) {
                case (null) { "" };
                case (?link) { link };
            };
        });
    };

    public query ({ caller }) func details() : async Result.Result<CoreTypes.Workspaces.Workspace, { #unauthorized }> {
        // Check if the user is authorized to view the workspace
        if (_visibility == #Private and not isWorkspaceMember(caller)) {
            return #err(#unauthorized);
        };

        return #ok({
            name = _name;
            description = _description;
            owners = _owners;
            createdAt = _createdAt;
            updatedAt = _updatedAt;
        });
    };

    /*************************************************************************
     * Updates
     *************************************************************************/

    public shared ({ caller }) func handleUserEvent(event : UserTypes.UserEvent) : async () {
        let user = switch (UserRegistryV2.findUserByUserId(_users, caller)) {
            case (null) { return };
            case (?user) { user };
        };

        switch (event.event) {
            case (#profileUpdated(data)) {
                let updatedUser = { user with username = data.profile.username };
                UserRegistryV2.updateUserByUserId<WorkspaceUser>(_users, caller, updatedUser);
            };
        };
    };

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
        addUser(caller, canisterId, username, #member);

        // Subscribe to the user's canister
        await user.subscribe(#profileUpdated, handleUserEvent);

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

    public shared ({ caller }) func createPage(
        input : Types.Updates.CreatePage.CreatePageInput
    ) : async Types.Updates.CreatePage.CreatePageOutput {
        let user = UserRegistry.findUser(userRegistry, caller);

        // Check if the user is authorized to create a page
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

        PageAccessManager.addInvitedUser(
            _pageAccessManager,
            UUID.toText(input.uuid),
            caller,
            #full,
        );

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
        let user = UserRegistry.findUser(userRegistry, caller);

        // Check if the user is authorized to update the settings
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

        // Check if the user is authorized to update the settings
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

    ignore Timer.setTimer(
        #seconds(0),
        func() : async () {
            // Additional initialization
            if (Map.size(_users.users) == 0) {
                for ((identity, user) in Array.vals(initArgs.initialUsers)) {
                    Debug.print("Adding user: " # debug_show user);
                    addUser(identity, user.canisterId, user.username, user.role);
                    let userActor = actor (Principal.toText(user.canisterId)) : UserActor;
                    ignore userActor.subscribe(#profileUpdated, handleUserEvent);
                };
            };
        },
    );

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

        ignore Timer.setTimer(
            #seconds(0),
            func() : async () {
                for (user in UserRegistryV2.getUsers(_users).vals()) {
                    let userActor = actor (Principal.toText(user.canisterId)) : UserActor;
                    await userActor.subscribe(#profileUpdated, handleUserEvent);
                };
            },
        );
    };
};
