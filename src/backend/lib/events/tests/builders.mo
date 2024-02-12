import EventStream "../EventStream";

module Builders {
    class DefaultEventStreamAdapter<EventT>() {
        public func getEventId(event : EventT) : Text {
            return "";
        };
    };

    public class EventStreamBuilder<EventT>() = self {
        var eventStream : EventStream.EventStream<EventT> = EventStream.EventStream<EventT>(
            DefaultEventStreamAdapter<EventT>()
        );

        public func withAdapter(
            adapter : {
                getEventId : (EventT) -> Text;
            }
        ) : EventStreamBuilder<EventT> {
            eventStream := EventStream.EventStream<EventT>(adapter);
            return self;
        };

        public func withEventIdGetter(getEventId : (EventT) -> Text) : EventStreamBuilder<EventT> {
            eventStream := EventStream.EventStream<EventT>({
                getEventId = getEventId;
            });
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
