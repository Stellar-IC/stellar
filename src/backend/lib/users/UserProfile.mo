import Time "mo:base/Time";
import Text "mo:base/Text";

import Types "./Types";

module UserProfile {
    type Username = Types.Username;

    public type UserProfile = {
        username : Username;
        avatarUrl : ?Text;
        created_at : Time.Time;
        updatedAt : Time.Time;
    };

    public type MutableUserProfile = {
        var username : Username;
        var avatarUrl : ?Text;
        var created_at : Time.Time;
        var updatedAt : Time.Time;
    };

    public func fromMutableUserProfile(profile : MutableUserProfile) : UserProfile {
        return {
            avatarUrl = profile.avatarUrl;
            username = profile.username;
            created_at = profile.created_at;
            updatedAt = profile.updatedAt;
        };
    };
};
