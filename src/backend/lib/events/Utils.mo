import UUID "mo:uuid/UUID";

import BlocksTypes "../blocks/types";

module EventUtils {
    public func getEventId(event : BlocksTypes.BlockEvent) : UUID.UUID {
        return event.uuid;
    };
};
