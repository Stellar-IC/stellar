import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";

import CoreTypes "../../../types";
import Types "../types";

module {
    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data(
        stable_data : {
            user_identity_to_canister_id : RBTree.Tree<Principal, Principal>;
            user_canister_id_to_identity : RBTree.Tree<Principal, Principal>;
        }
    ) {
        public let user_identity_to_canister_id = RBTree.RBTree<Principal, Principal>(Principal.compare);
        public let user_canister_id_to_identity = RBTree.RBTree<Principal, Principal>(Principal.compare);

        user_identity_to_canister_id.unshare(stable_data.user_identity_to_canister_id);
        user_canister_id_to_identity.unshare(stable_data.user_canister_id_to_identity);

        public func addUser(
            args : {
                user : Types.UserActor;
                user_id : Principal;
                owner : Principal;
            }
        ) : async () {
            var owner = args.owner;
            var user = args.user;
            var user_id = args.user_id;
            var existing_user_id : ?Principal = getUserIdByOwner(owner);

            switch existing_user_id {
                case null {};
                case (?actualUser) {
                    Debug.trap("User already added");
                };
            };
            user_identity_to_canister_id.put((owner, user_id));
            user_canister_id_to_identity.put((user_id, owner));

            return;
        };

        public func getUserIdByOwner(owner : Principal) : ?Principal {
            return user_identity_to_canister_id.get(owner);
        };

        public func getOwnerByUserId(user_id : Principal) : ?Principal {
            return user_canister_id_to_identity.get(user_id);
        };

        public func getUserByUserId(user_id : Principal) : Types.UserActor {
            return actor (Principal.toText(user_id)) : Types.UserActor;
        };
    };
};
