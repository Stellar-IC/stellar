import Bool "mo:base/Bool";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../../blocks/types";

module {
    public type BlockEvent = BlocksTypes.BlockEvent;

    public type UserSettingsUpdatedEvent = {
        uuid : UUID.UUID;
        key : Text;
        value : Bool;
    };

    public type UserEvent = {
        #blockCreated : BlocksTypes.BlockCreatedEvent;
        // #blockDeleted : BlocksTypes.BlockDeletedEvent;
        #blockUpdated : BlocksTypes.BlockUpdatedEvent;
        #userSettingsUpdated : UserSettingsUpdatedEvent;
    };

    public type EventId = Text;

    public type EventListener<EventT> = (event : EventT) -> ();

    public type Subscriber<EventT> = {
        name : Text;
        listener : EventListener<EventT>;
    };

    public type EventStatus = {
        #pending;
        #processed;
        #processing;
    };

    public type EventProcessingInfo<EventT> = {
        event : EventT;
        status : EventStatus;
        processedAt : ?Time.Time;
    };
};
