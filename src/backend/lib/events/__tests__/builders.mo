import EventStream "../event_stream";
import Logger "../../logger";

module Builders {
    class DefaultEventStreamAdapter<EventT>() {
        public func getEventId(event : EventT) : Text {
            return "";
        };
    };

    public class EventStreamBuilder<EventT>() = self {
        var logger = Logger.Logger([]);
        var eventStream : EventStream.EventStream<EventT> = EventStream.EventStream<EventT>(
            DefaultEventStreamAdapter<EventT>(),
            { logger },
        );

        public func withAdapter(
            adapter : {
                getEventId : (EventT) -> Text;
            }
        ) : EventStreamBuilder<EventT> {
            eventStream := EventStream.EventStream<EventT>(adapter, { logger });
            return self;
        };

        public func withEventIdGetter(getEventId : (EventT) -> Text) : EventStreamBuilder<EventT> {
            eventStream := EventStream.EventStream<EventT>(
                {
                    getEventId = getEventId;
                },
                { logger },
            );
            return self;
        };

        public func withEventListener(name : Text, listener : (EventT) -> ()) : EventStreamBuilder<EventT> {
            eventStream.addEventListener(
                name,
                listener,
            );
            return self;
        };

        public func build() : EventStream.EventStream<EventT> {
            return eventStream;
        };
    };
};
