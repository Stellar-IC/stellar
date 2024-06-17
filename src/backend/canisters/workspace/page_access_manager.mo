import Map "mo:map/Map";
import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Types "./types/v2";

module PageAccessManager {
    public type PageId = Text;
    public type PageAccessSetting = Types.PageAccessSetting;
    public type PageAccessLevel = Types.PageAccessLevel;

    public type UserAccessMap = Map.Map<Principal, PageAccessLevel>;
    public type InvitedUserMap = Map.Map<PageId, UserAccessMap>;

    public let defaultAccessSetting : PageAccessSetting = #invited;

    public class PageAccessManager() {
        public let accessSettings = Map.new<PageId, PageAccessSetting>();
        public let invitedUsers : InvitedUserMap = Map.new();
    };

    public func get(
        manager : PageAccessManager,
        pageId : PageId,
    ) : ?PageAccessSetting {
        let result = Map.get<PageId, PageAccessSetting>(
            manager.accessSettings,
            Map.thash,
            pageId,
        );

        switch result {
            case (null) { return null };
            case (?setting) { return ?setting };
        };
    };

    public func getOrDefault(
        manager : PageAccessManager,
        pageId : PageId,
    ) : PageAccessSetting {
        let result = get(manager, pageId);

        switch result {
            case (?setting) { return setting };
            case (null) { return defaultAccessSetting };
        };
    };

    public func set(
        manager : PageAccessManager,
        pageId : PageId,
        setting : PageAccessSetting,
    ) {
        ignore Map.put(manager.accessSettings, Map.thash, pageId, setting);
    };

    public func addInvitedUser(
        manager : PageAccessManager,
        pageId : PageId,
        userId : Principal,
        accessLevel : PageAccessLevel,
    ) {
        let users : UserAccessMap = switch (
            Map.get(manager.invitedUsers, Map.thash, pageId)
        ) {
            case (null) { Map.new() };
            case (?users) { users };
        };

        ignore Map.put(users, Map.phash, userId, accessLevel);
        ignore Map.put(manager.invitedUsers, Map.thash, pageId, users);
    };

    public func getInvitedUsers(
        manager : PageAccessManager,
        pageId : PageId,
    ) : [(Principal, PageAccessLevel)] {
        switch (Map.get(manager.invitedUsers, Map.thash, pageId)) {
            case (null) { [] };
            case (?users) {
                Iter.toArray(Map.entries<Principal, PageAccessLevel>(users));
            };
        };
    };

    public func removeInvitedUser(
        manager : PageAccessManager,
        pageId : PageId,
        user : Principal,
    ) {
        var users : UserAccessMap = switch (
            Map.get(manager.invitedUsers, Map.thash, pageId)
        ) {
            case (null) { return };
            case (?users) { users };
        };

        users := Map.mapFilter<Principal, PageAccessLevel, PageAccessLevel>(
            users,
            Map.phash,
            func(entry) : ?PageAccessLevel {
                let userId = entry.0;
                let accessLevel = entry.1;
                if (userId == user) return null;
                return ?accessLevel;
            },
        );

        ignore Map.put(manager.invitedUsers, Map.thash, pageId, users);
    };

    public func getUserAccessLevel(
        manager : PageAccessManager,
        pageId : PageId,
        userIdentity : Principal,
        isWorkspaceMember : Bool,
    ) : PageAccessLevel {
        let setting = getOrDefault(manager, pageId);

        switch setting {
            case (#invited) {
                let users = switch (
                    Map.get(manager.invitedUsers, Map.thash, pageId)
                ) {
                    case (null) { return #none };
                    case (?users) { users };
                };

                let accessLevel = switch (
                    Map.get(users, Map.phash, userIdentity)
                ) {
                    case (null) { return #none };
                    case (?level) { level };
                };
            };
            case (#workspaceMember(accessLevel)) {
                if (isWorkspaceMember) {
                    return accessLevel;
                };

                return #none;
            };
            case (#everyone(accessLevel)) {
                return accessLevel;
            };
        };
    };
};
