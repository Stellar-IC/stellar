import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";

import Types "../../../types";

import User "../../user/main";

module {
    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data(
        stable_data : {
            username_to_user_id : RBTree.Tree<Text, Types.UserId>;
            principal_to_user_id : RBTree.Tree<Principal, Types.UserId>;
            user_id_to_principal : RBTree.Tree<Types.UserId, Principal>;
        }
    ) {
        public let username_to_user_id = RBTree.RBTree<Text, Types.UserId>(Text.compare);
        public let principal_to_user_id = RBTree.RBTree<Principal, Types.UserId>(Principal.compare);
        public let user_id_to_principal = RBTree.RBTree<Types.UserId, Principal>(Principal.compare);

        principal_to_user_id.unshare(stable_data.principal_to_user_id);
        username_to_user_id.unshare(stable_data.username_to_user_id);
        user_id_to_principal.unshare(stable_data.user_id_to_principal);

        public func addUser(
            args : {
                user : User.User;
                user_id : Types.UserId;
                principal : Principal;
            }
        ) : async () {
            var principal = args.principal;
            var user_id = args.user_id;
            var existing_user_id : ?Types.UserId = getUserIdByPrincipal(principal);

            switch existing_user_id {
                case null {};
                case (?actualUser) {
                    Debug.trap("User already added");
                };
            };
            principal_to_user_id.put((principal, user_id));
            user_id_to_principal.put((user_id, principal));

            return;
        };

        public func getUserIdByPrincipal(principal : Principal) : ?Types.UserId {
            return principal_to_user_id.get(principal);
        };

        public func getPrincipalByUserId(user_id : Types.UserId) : ?Principal {
            return user_id_to_principal.get(user_id);
        };

        public func getUsers() : [Principal] {
            var users : List.List<Principal> = List.nil<Principal>();

            for (entry in user_id_to_principal.entries()) {
                users := List.push<Principal>(entry.1, users);
            };

            return List.toArray(users);
        };
    };
};
