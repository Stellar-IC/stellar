import List "mo:base/List";
import Deque "mo:base/Deque";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";

module {
    public type EventListener<EventT> = (event : EventT) -> ();

    public type Subscriber<EventT> = {
        name : Text;
        listener : EventListener<EventT>;
    };

    public class EventStream<EventT>(
        helpers : {
            getEventId : (event : EventT) -> Text;
        }
    ) {
        var subscribers = List.fromArray<Subscriber<EventT>>([]);
        var events = Deque.empty<EventT>();
        var eventProcessingHistory = TrieMap.TrieMap<Text, { processed : Bool }>(Text.equal, Text.hash);
        var currentlyProcessing = false;

        public func addEventListener(name : Text, listener : EventListener<EventT>) {
            subscribers := List.append<Subscriber<EventT>>(
                subscribers,
                List.fromArray<Subscriber<EventT>>([{ name; listener }]),
            );
        };

        public func removeEventListener(name : Text) {
            subscribers := List.filter<Subscriber<EventT>>(
                subscribers,
                func(subscriber) {
                    subscriber.name != name;
                },
            );
        };

        public func publish(event : EventT) {
            events := Deque.pushFront<EventT>(events, event);
            eventProcessingHistory.put(helpers.getEventId(event), { processed = false });
        };

        /**
         * Process all events in the queue in order. This will only process the
         * next event if the previous event has been successfully processed. If
         * an event fails to be processed, it will be retried on the next call
         * to processEvents.
         */
        public func processEvents() {
            if (currentlyProcessing) {
                return;
            };

            currentlyProcessing := true;

            var iteration = 0;

            label doLoop while (Deque.isEmpty(events) == false and iteration < 100) {
                let event = switch (Deque.peekBack<EventT>(events)) {
                    case null { continue doLoop };
                    case (?event) { event };
                };
                let eventId = helpers.getEventId(event);
                let eventHistory = switch (eventProcessingHistory.get(eventId)) {
                    case null { { processed = false } };
                    case (?eventHistory) { eventHistory };
                };

                if (eventHistory.processed) {
                    switch (Deque.popBack<EventT>(events)) {
                        case null {};
                        case (?(newEvents, popped)) {
                            events := newEvents;
                        };
                    };
                } else {
                    switch (Deque.popBack<EventT>(events)) {
                        case null {};
                        case (?(newEvents, popped)) {
                            for (subscriber in List.toIter(subscribers)) {
                                subscriber.listener(event);
                            };
                            eventProcessingHistory.put(eventId, { processed = true });
                            events := newEvents;
                        };
                    };
                };

                iteration := iteration + 1;
            };

            currentlyProcessing := false;
        };
    };
};
