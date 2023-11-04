import Time "mo:base/Time";

import Types "../types";

module UserProfile {
    type Username = Types.Username;

    public type UserProfile = {
        username : Username;
        created_at : Time.Time;
        updatedAt : Time.Time;
    };

    public type MutableUserProfile = {
        var username : Username;
        var created_at : Time.Time;
        var updatedAt : Time.Time;
    };

    public func fromMutableUserProfile(profile : MutableUserProfile) : UserProfile {
        return {
            username = profile.username;
            created_at = profile.created_at;
            updatedAt = profile.updatedAt;
        };
    };
};
