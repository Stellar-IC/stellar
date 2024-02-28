import Time "mo:base/Time";
import UUID "mo:uuid/UUID";
import BlocksTypes "../../../lib/blocks/types";

module {
    public type ActivityItem = {
        uuid : UUID.UUID;
        var events : [BlocksTypes.BlockEvent];
        blockExternalId : UUID.UUID;
        startTime : Time.Time;
        var endTime : Time.Time;
    };

    public type Activity = {
        uuid : UUID.UUID;
        var edits : [EditItem];
        blockExternalId : UUID.UUID;
        startTime : Time.Time;
        var endTime : Time.Time;
    };

    public type EditItem = {
        startTime : Time.Time;
        blockValue : {
            before : ?BlocksTypes.Block;
            after : BlocksTypes.Block;
        };
    };
};
