import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import Result "mo:base/Result";

import CoreTypes "../../types";
import User "../user/main";
import Types "./types";

module {
    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data(
        stable_data : {
            user_identity_to_canister_id : RBTree.Tree<Principal, Principal>;
            user_canister_id_to_identity : RBTree.Tree<Principal, Principal>;
            username_to_user_id : RBTree.Tree<Text, Principal>;
        }
    ) {
        public let user_identity_to_canister_id = RBTree.RBTree<Principal, Principal>(Principal.compare);
        public let user_canister_id_to_identity = RBTree.RBTree<Principal, Principal>(Principal.compare);
        public let username_to_user_id = RBTree.RBTree<Text, Principal>(Text.compare);

        user_identity_to_canister_id.unshare(stable_data.user_identity_to_canister_id);
        user_canister_id_to_identity.unshare(stable_data.user_canister_id_to_identity);
        username_to_user_id.unshare(stable_data.username_to_user_id);

        public func addUser(
            args : {
                user : User.User;
                userId : Principal;
                owner : Principal;
            }
        ) : () {
            var owner = args.owner;
            var user = args.user;
            var userId = args.userId;
            var existing_user_id : ?Principal = getUserIdByOwner(owner);

            switch existing_user_id {
                case null {};
                case (?actualUser) {
                    Debug.trap("User already added");
                };
            };
            user_identity_to_canister_id.put((owner, userId));
            user_canister_id_to_identity.put((userId, owner));

            return;
        };

        public func getUserIdByOwner(owner : Principal) : ?Principal {
            return user_identity_to_canister_id.get(owner);
        };

        public func getOwnerByUserId(user_id : Principal) : ?Principal {
            return user_canister_id_to_identity.get(user_id);
        };

        public func getUserByUserId(user_id : Principal) : User.User {
            return actor (Principal.toText(user_id)) : User.User;
        };

        type CheckUserNameResult = Result.Result<(), { #UsernameTaken }>;

        public func checkUsername(username : Text) : CheckUserNameResult {
            switch (username_to_user_id.get(username)) {
                case (null) { #ok };
                case (?userId) {
                    return #err(#UsernameTaken);
                };
            };
        };
    };
};
