import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";

import CoreTypes "../../../types";
import User "../../user/main";
import Types "../types";

module {
    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data(
        stable_data : {
            username_to_user_id : RBTree.Tree<Text, CoreTypes.UserId>;
            owner_to_user_id : RBTree.Tree<Principal, CoreTypes.UserId>;
            user_id_to_owner : RBTree.Tree<CoreTypes.UserId, Principal>;
        }
    ) {
        public let username_to_user_id = RBTree.RBTree<Text, CoreTypes.UserId>(Text.compare);
        public let owner_to_user_id = RBTree.RBTree<Principal, CoreTypes.UserId>(Principal.compare);
        public let user_id_to_owner = RBTree.RBTree<CoreTypes.UserId, Principal>(Principal.compare);

        owner_to_user_id.unshare(stable_data.owner_to_user_id);
        username_to_user_id.unshare(stable_data.username_to_user_id);
        user_id_to_owner.unshare(stable_data.user_id_to_owner);

        public func addUser(
            args : {
                user : User.User;
                user_id : CoreTypes.UserId;
                owner : Principal;
            }
        ) : async () {
            var owner = args.owner;
            var user = args.user;
            var user_id = args.user_id;
            var existing_user_id : ?CoreTypes.UserId = getUserIdByOwner(owner);

            switch existing_user_id {
                case null {};
                case (?actualUser) {
                    Debug.trap("User already added");
                };
            };
            owner_to_user_id.put((owner, user_id));
            user_id_to_owner.put((user_id, owner));

            return;
        };

        public func getUserIdByOwner(owner : Principal) : ?CoreTypes.UserId {
            return owner_to_user_id.get(owner);
        };

        public func getOwnerByUserId(user_id : CoreTypes.UserId) : ?Principal {
            return user_id_to_owner.get(user_id);
        };

        public func getUserByUserId(user_id : CoreTypes.UserId) : Types.UserActor {
            return actor (Principal.toText(user_id)) : Types.UserActor;
        };
    };
};
