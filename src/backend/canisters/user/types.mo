import Result "mo:base/Result";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import CoreTypes "../../types";
import UserProfile "../../lib/users/user_profile";

module {
    public type UserInitArgs = {
        capacity : Nat;
        owner : Principal;
    };

    public type PersonalWorkspace = actor {
        walletReceive : shared () -> async ({ accepted : Nat64 });
    };

    public type UserEventName = {
        #profileUpdated;
    };

    public type ProfileUpdatedEventData = { profile : UserProfile.UserProfile };

    public type UserEvent = {
        userId : Principal;
        event : {
            #profileUpdated : ProfileUpdatedEventData;
        };
    };

    public type UserEventSubscription = shared (event : UserEvent) -> async ();

    public type ProfileUpdatedSubscription = shared (event : UserEvent) -> async ();

};
