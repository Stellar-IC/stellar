import Array "mo:base/Array";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Map "mo:map/Map";

import S "../state";

module {
    public func getActiveUsers(state : S.State) : [Principal] {
        state.data.activeUsers;
    };

    public func getActiveUsersForPage(state : S.State, pageId : Text) : [Principal] {
        switch (Map.get(state.data.activeUsersByPage, Map.thash, pageId)) {
            case (?users) { users };
            case null { [] };
        };
    };

    public func markUserAsActive(state : S.State, userId : Principal, pageId : Text) : () {
        let userAlreadyActive = Array.indexOf<Principal>(userId, state.data.activeUsers, Principal.equal) != null;

        if (userAlreadyActive) {
            return;
        };

        state.data.activeUsers := Array.append(state.data.activeUsers, [userId]);

        let currentUsers = switch (Map.get(state.data.activeUsersByPage, Map.thash, pageId)) {
            case (?users) { users };
            case null { [] };
        };

        let updatedUsers = Array.append(currentUsers, [userId]);

        ignore Map.put(state.data.activeUsersByPage, Map.thash, pageId, updatedUsers);

        Debug.print("active users for page" # debug_show (pageId) # debug_show (updatedUsers));

        resetActivityTimerForUser(state, userId, pageId);
    };

    public func markUserAsInactive(state : S.State, userId : Principal, pageId : Text) : () {
        Debug.print("marking user as inactive" # debug_show (userId) # pageId);
        state.data.activeUsers := Array.filter<Principal>(state.data.activeUsers, func(u) { u != userId });

        let currentUsers = switch (Map.get(state.data.activeUsersByPage, Map.thash, pageId)) {
            case (?users) { users };
            case null { [] };
        };
        let updatedUsers = Array.filter<Principal>(currentUsers, func(u) { u != userId });

        Debug.print("active users for page" # debug_show (pageId) # debug_show (updatedUsers));

        ignore Map.put(state.data.activeUsersByPage, Map.thash, pageId, updatedUsers);
    };

    private func resetActivityTimerForUser(state : S.State, userId : Principal, pageId : Text) : () {
        // clear any existing timer
        switch (Map.get(state.data.activeUserTimers, Map.phash, userId)) {
            case (?timer) { Timer.cancelTimer(timer) };
            case null {};
        };

        let timer = Timer.setTimer(
            #seconds(30),
            func() : async () {
                markUserAsInactive(state, userId, pageId);
            },
        );

        ignore Map.put(state.data.activeUserTimers, Map.phash, userId, timer);
    };
};
