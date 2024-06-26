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

    public class UserRegistry<UserT>() {
        public let users = Map.new<Identity, UserT>();
        public let userIdentityByUserId = Map.new<Identity, CanisterId>();
    };

    public func addUser<UserT>(
        userRegistry : UserRegistry<UserT>,
        userIdentity : Identity,
        userCanisterId : CanisterId,
        user : UserT,
    ) {
        ignore Map.put<CanisterId, UserT>(userRegistry.users, Map.phash, userIdentity, user);
        ignore Map.put<CanisterId, Identity>(userRegistry.userIdentityByUserId, Map.phash, userCanisterId, userIdentity);
    };

    public func updateUser<UserT>(
        userRegistry : UserRegistry<UserT>,
        userIdentity : Principal,
        updatedUser : UserT,
    ) {
        let user = findUser(userRegistry, userIdentity);
        switch (user) {
            case (null) { return };
            case (?_) {};
        };

        ignore Map.put(userRegistry.users, Map.phash, userIdentity, updatedUser);
    };

    public func updateUserByUserId<UserT>(
        userRegistry : UserRegistry<UserT>,
        userCanisterId : Principal,
        updatedUser : UserT,
    ) {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, userCanisterId)) {
            case (null) { return };
            case (?userIdentity) { userIdentity };
        };
        let user = findUser(userRegistry, userIdentity);
        switch (user) {
            case (null) { return };
            case (?_) {};
        };

        ignore Map.put(userRegistry.users, Map.phash, userIdentity, updatedUser);
    };

    public func findUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Identity) : ?UserT {
        return Map.get(userRegistry.users, Map.phash, userIdentity);
    };

    public func findUserByUserId<UserT>(userRegistry : UserRegistry<UserT>, userCanisterId : CanisterId) : ?UserT {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, userCanisterId)) {
            case (null) { return null };
            case (?userIdentity) { userIdentity };
        };

        return Map.get(userRegistry.users, Map.phash, userIdentity);
    };

    public func filter<UserT>(
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

    public func getUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Principal) : UserT {
        let user = switch (findUser(userRegistry, userIdentity)) {
            case (null) { Debug.trap("User not found") };
            case (?user) { user };
        };

        return user;
    };

    public func getUserByUserId<UserT>(userRegistry : UserRegistry<UserT>, userCanisterId : Principal) : UserT {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, userCanisterId)) {
            case (null) { return Debug.trap("User not found") };
            case (?userIdentity) { userIdentity };
        };

        let user = switch (findUser(userRegistry, userIdentity)) {
            case (null) { Debug.trap("User not found") };
            case (?user) { user };
        };

        return user;
    };

    public func getUsers<UserT>(userRegistry : UserRegistry<UserT>) : [UserT] {
        let userCount = Iter.size(Map.entries(userRegistry.users));
        let users = Buffer.Buffer<UserT>(userCount);

        for (user in Map.entries(userRegistry.users)) {
            users.add(user.1);
        };

        return Buffer.toArray(users);
    };
};
