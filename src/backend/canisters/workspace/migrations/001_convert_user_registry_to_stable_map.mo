import Map "mo:map/Map";
import Principal "mo:base/Principal";

import UserRegistry "../../../lib/user_registry";
import UserRegistryV2 "../../../lib/user_registry_v2";
import CoreTypes "../../../types";

import Types "../types/v2";

module Migration001ConvertUserRegistryToStableMap {
    type BlockUserRole = Types.BlockUserRole;
    type WorkspaceUser = CoreTypes.Workspaces.WorkspaceUser;

    public func up(
        initial : UserRegistry.UserRegistry<WorkspaceUser>,
        final : UserRegistryV2.UserRegistry<WorkspaceUser>,
    ) {
        for (entry in initial.users.entries()) {
            let user = {
                entry.1 with rolesByBlock = Map.new<Text, BlockUserRole>()
            };

            ignore Map.put(final.users, Map.phash, entry.0, user);
        };
    };
};
