import Map "mo:map/Map";
import Principal "mo:base/Principal";

import UserRegistry "../../../lib/user_registry";
import UserRegistryV2 "../../../lib/user_registry_v2";

import Types "../types/v2";

module Migration_001_Add_Roles_By_Block_To_User_Registry_Items {
    type BlockUserRole = Types.BlockUserRole;
    type WorkspaceUser = Types.WorkspaceUser;
    type WorkspaceUserV2 = Types.WorkspaceUserV2;

    public func up(
        initial : UserRegistry.UserRegistry<WorkspaceUser>,
        final : UserRegistryV2.UserRegistry<WorkspaceUserV2>,
    ) {
        for (entry in initial.users.entries()) {
            let user = {
                entry.1 with rolesByBlock = Map.new<Text, BlockUserRole>()
            };

            ignore Map.put(final.users, Map.phash, entry.0, user);
        };
    };
};
