import Time "mo:base/Time";
import UUID "mo:uuid/UUID";
import BlocksTypes "../../../lib/blocks/types";

module {
    public type Activity = {
        uuid : UUID.UUID;
        var edits : [EditItem];
        blockExternalId : UUID.UUID;
        startTime : Time.Time;
        var endTime : Time.Time;
    };

    public type EditItemUser = Principal;

    public type EditItem = {
        user : EditItemUser;
        startTime : Time.Time;
        blockValue : {
            before : ?BlocksTypes.Block;
            after : BlocksTypes.Block;
        };
    };

    public type ShareableActivity = {
        uuid : UUID.UUID;
        edits : [ShareableEditItem];
        blockExternalId : UUID.UUID;
        startTime : Time.Time;
        endTime : Time.Time;
    };

    public type ShareableEditItem = {
        user : EditItemUser;
        startTime : Time.Time;
        blockValue : {
            before : ?BlocksTypes.ShareableBlock;
            after : BlocksTypes.ShareableBlock;
        };
    };

    public type HydratedEditItemUser = {
        canisterId : Principal;
        username : Text;
    };

    public type HydratedEditItem = {
        user : HydratedEditItemUser;
        startTime : Time.Time;
        blockValue : {
            before : ?BlocksTypes.ShareableBlock;
            after : BlocksTypes.ShareableBlock;
        };
    };

    public type HydratedActivity = {
        uuid : UUID.UUID;
        users : [HydratedEditItemUser];
        edits : [HydratedEditItem];
        blockExternalId : UUID.UUID;
        startTime : Time.Time;
        endTime : Time.Time;
    };
};
