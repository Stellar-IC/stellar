import Array "mo:base/Array";
import Debug "mo:base/Debug";
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
            user_id_to_user_canister : RBTree.Tree<Types.UserId, User.User>;
        }
    ) {
        public let username_to_user_id = RBTree.RBTree<Text, Types.UserId>(Text.compare);
        public let principal_to_user_id = RBTree.RBTree<Principal, Types.UserId>(Principal.compare);
        public let user_id_to_principal = RBTree.RBTree<Types.UserId, Principal>(Principal.compare);
        public let user_id_to_user_canister = RBTree.RBTree<Types.UserId, User.User>(Principal.compare);

        principal_to_user_id.unshare(stable_data.principal_to_user_id);
        username_to_user_id.unshare(stable_data.username_to_user_id);
        user_id_to_principal.unshare(stable_data.user_id_to_principal);
        user_id_to_user_canister.unshare(stable_data.user_id_to_user_canister);

        public func addUser(
            args : {
                user : User.User;
                user_id : Types.UserId;
                principal : Principal;
            }
        ) : async () {
            var principal = args.principal;
            var user_canister = args.user;
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
            user_id_to_user_canister.put((user_id, user_canister));

            return;
        };

        public func getUserIdByPrincipal(principal : Principal) : ?Types.UserId {
            return principal_to_user_id.get(principal);
        };

        public func getPrincipalByUserId(user_id : Types.UserId) : ?Principal {
            return user_id_to_principal.get(user_id);
        };

        public func getUserByUserId(user_id : Types.UserId) : ?User.User {
            return user_id_to_user_canister.get(user_id);
        };
    };
};
