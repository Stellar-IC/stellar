import Bool "mo:base/Bool";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import Types "./v0";

module {
    public type BlockEvent = Types.BlockEvent;
    public type EventId = Types.EventId;
    public type EventListener<EventT> = Types.EventListener<EventT>;
    public type Subscriber<EventT> = Types.Subscriber<EventT>;
    public type EventStatus = Types.EventStatus;
    public type EventProcessingInfo<EventT> = Types.EventProcessingInfo<EventT>;
};
