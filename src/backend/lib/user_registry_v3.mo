import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import Map "mo:map/Map";

module UserRegistry {
    type CanisterId = Principal;
    type Identity = Principal;

    type BaseUser = {
        canisterId : Principal;
        username : Text;
    };

    public class UserRegistry<UserT <: BaseUser>() {
        public let users = Map.new<CanisterId, UserT>();

        // Indexes
        public let userIdentityByUserId = Map.new<CanisterId, Identity>();
        public let usernameIndex = Map.new<Text, CanisterId>();
    };

    public func addUser<UserT <: BaseUser>(
        userRegistry : UserRegistry<UserT>,
        userIdentity : Principal,
        userCanisterId : Principal,
        user : UserT,
    ) {
        ignore Map.put<CanisterId, UserT>(userRegistry.users, Map.phash, userIdentity, user);
        ignore Map.put<Principal, Principal>(userRegistry.userIdentityByUserId, Map.phash, userCanisterId, userIdentity);
        ignore Map.put<Text, Principal>(userRegistry.usernameIndex, Map.thash, user.username, userCanisterId);
    };

    public func updateUser<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>, userIdentity : Principal, user : UserT) {
        ignore Map.put(userRegistry.users, Map.phash, userIdentity, user);
    };

    public func updateUserByUserId<UserT <: BaseUser>(
        userRegistry : UserRegistry<UserT>,
        canisterId : CanisterId,
        user : UserT,
    ) {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, canisterId)) {
            case (null) { return };
            case (?userIdentity) { userIdentity };
        };

        ignore Map.put(userRegistry.users, Map.phash, userIdentity, user);
    };

    public func findUserByIdentity<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>, userIdentity : Principal) : ?UserT {
        return Map.get(userRegistry.users, Map.phash, userIdentity);
    };

    public func findUserByUsername<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>, username : Text) : ?UserT {
        let userId = switch (Map.get(userRegistry.usernameIndex, Map.thash, username)) {
            case (null) { return null };
            case (?id) { id };
        };

        return Map.get(userRegistry.users, Map.phash, userId);
    };

    public func findUserByUserId<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>, userCanisterId : Principal) : ?UserT {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, userCanisterId)) {
            case (null) { return null };
            case (?userIdentity) { userIdentity };
        };

        return Map.get(userRegistry.users, Map.phash, userIdentity);
    };

    public func filter<UserT <: BaseUser>(
        userRegistry : UserRegistry<UserT>,
        predicate : (user : UserT) -> Bool,
    ) : [UserT] {
        let users = Buffer.Buffer<UserT>(10);

        for (user in Map.entries(userRegistry.users)) {
            if (predicate(user.1)) {
                users.add(user.1);
            };
        };

        return Buffer.toArray(users);
    };

    public func getUser<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>, userIdentity : Principal) : UserT {
        let user = switch (findUserByIdentity(userRegistry, userIdentity)) {
            case (null) { Debug.trap("User not found") };
            case (?user) { user };
        };

        return user;
    };

    public func getUserByUserId<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>, userCanisterId : Principal) : UserT {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, userCanisterId)) {
            case (null) { return Debug.trap("User not found") };
            case (?userIdentity) { userIdentity };
        };

        let user = switch (findUserByIdentity(userRegistry, userIdentity)) {
            case (null) { Debug.trap("User not found") };
            case (?user) { user };
        };

        return user;
    };

    public func getUsers<UserT <: BaseUser>(userRegistry : UserRegistry<UserT>) : [UserT] {
        let userCount = Iter.size(Map.entries(userRegistry.users));
        let users = Buffer.Buffer<UserT>(userCount);

        for (user in Map.entries(userRegistry.users)) {
            users.add(user.1);
        };

        return Buffer.toArray(users);
    };
};
