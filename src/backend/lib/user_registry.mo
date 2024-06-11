import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import Map "mo:map/Map";

module UserRegistry {
    public class UserRegistry<UserT>() {
        // The user registry is a map from user canister id to user.
        public let users = RBTree.RBTree<Principal, UserT>(Principal.compare);
        public let userIdentityByUserId = Map.new<Principal, Principal>();

        public func preupgrade() : RBTree.Tree<Principal, UserT> {
            return users.share();
        };

        public func postupgrade(upgradeData : RBTree.Tree<Principal, UserT>) {
            users.unshare(upgradeData);
        };
    };

    public func addUser<UserT>(
        userRegistry : UserRegistry<UserT>,
        userIdentity : Principal,
        userCanisterId : Principal,
        user : UserT,
    ) {
        userRegistry.users.put(userIdentity, user);
        ignore Map.put<Principal, Principal>(userRegistry.userIdentityByUserId, Map.phash, userCanisterId, userIdentity);
    };

    public func updateUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Principal, user : UserT) {
        userRegistry.users.put(userIdentity, user);
    };

    public func findUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Principal) : ?UserT {
        return userRegistry.users.get(userIdentity);
    };

    public func findUserByUserId<UserT>(userRegistry : UserRegistry<UserT>, userCanisterId : Principal) : ?UserT {
        let userIdentity = switch (Map.get(userRegistry.userIdentityByUserId, Map.phash, userCanisterId)) {
            case (null) { return null };
            case (?userIdentity) { userIdentity };
        };

        return userRegistry.users.get(userIdentity);
    };

    public func filter<UserT>(
        userRegistry : UserRegistry<UserT>,
        predicate : (user : UserT) -> Bool,
    ) : [UserT] {
        let users = Buffer.Buffer<UserT>(10);

        for (user in userRegistry.users.entries()) {
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
        let userCount = Iter.size(userRegistry.users.entries());
        let users = Buffer.Buffer<UserT>(userCount);

        for (user in userRegistry.users.entries()) {
            users.add(user.1);
        };

        return Buffer.toArray(users);
    };
};
