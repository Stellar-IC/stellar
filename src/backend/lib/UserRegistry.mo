import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";

module UserRegistry {
    public class UserRegistry<UserT>() {
        public let users = RBTree.RBTree<Principal, UserT>(Principal.compare);

        public func preupgrade() : RBTree.Tree<Principal, UserT> {
            return users.share();
        };

        public func postupgrade(upgradeData : RBTree.Tree<Principal, UserT>) {
            users.unshare(upgradeData);
        };
    };

    public func addUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Principal, user : UserT) {
        userRegistry.users.put(userIdentity, user);
    };

    public func findUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Principal) : ?UserT {
        return userRegistry.users.get(userIdentity);
    };

    public func getUser<UserT>(userRegistry : UserRegistry<UserT>, userIdentity : Principal) : UserT {
        let user = switch (findUser(userRegistry, userIdentity)) {
            case (null) { Debug.trap("User not found") };
            case (?user) { user };
        };

        return user;
    };
};
