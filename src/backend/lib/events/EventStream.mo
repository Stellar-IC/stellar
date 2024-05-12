import List "mo:base/List";
import Deque "mo:base/Deque";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

import Logger "../Logger";
import Types "./Types";

module EventStream {
    type EventId = Types.EventId;
    type EventListener<EventT> = Types.EventListener<EventT>;
    type EventStatus = Types.EventStatus;
    type Subscriber<EventT> = Types.Subscriber<EventT>;

    type EventProcessingInfo<EventT> = {
        event : EventT;
        status : EventStatus;
        processedAt : ?Time.Time;
    };

    public type UpgradeData<EventT> = {
        queue : [EventId];
        events : [(EventId, EventProcessingInfo<EventT>)];
    };

    let DEFAULT_EVENT_STATUS : EventStatus = #pending;

    public class EventStream<EventT>(
        adapter : { getEventId : (event : EventT) -> Text },
        {
            logger : Logger.Logger;
        },
    ) {
        private var subscribers = List.fromArray<Subscriber<EventT>>([]);
        private var queue = Deque.empty<EventId>();
        private var events = TrieMap.TrieMap<EventId, EventProcessingInfo<EventT>>(Text.equal, Text.hash);
        private var currentlyProcessing = false;

        public func addEventListener(name : Text, listener : EventListener<EventT>) {
            subscribers := List.append<Subscriber<EventT>>(
                subscribers,
                List.fromArray([{ name; listener }]),
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

        public func publish(event : EventT) : () {
            addEventToQueue(event);
            saveEventProcessingInfo(createEventProcessingInfo(event));
        };

        /**
         * Process all events in the queue in order. This will only process the
         * next event if the previous event has been successfully processed. If
         * an event fails to be processed, it will be retried on the next call
         * to processEvents.
         */
        public func processEvents() : () {
            if (currentlyProcessing) {
                return;
            };

            if (Deque.isEmpty(queue)) {
                return;
            };

            logger.info("\n\nProcessing events");

            var maxIterationCount = 100;
            currentlyProcessing := true;

            label processQueue while (Deque.isEmpty(queue) == false and maxIterationCount > 0) {
                logger.info("Processing...");

                let eventId = switch (Deque.peekFront<EventId>(queue)) {
                    case null { continue processQueue };
                    case (?eventId) { eventId };
                };
                let eventStatus = getEventStatus(eventId);

                switch (eventStatus) {
                    case null {};
                    case (? #pending) {
                        switch (getEvent(eventId)) {
                            case null {};
                            case (?(event)) {
                                changeEventStatus(eventId, #processing);
                                notifySubscribers(event);
                                changeEventStatus(eventId, #processed);
                                advanceQueue();
                            };
                        };
                    };
                    case (? #processing) {
                        break processQueue;
                    };
                    case (? #processed) {
                        advanceQueue();
                    };
                };

                maxIterationCount := maxIterationCount + 1;
            };

            currentlyProcessing := false;

            logger.info("Finished processing events");
        };

        public func preupgrade() : UpgradeData<EventT> {
            return {
                queue = prepareQueueForUpgrade();
                events = prepareEventsForUpgrade();
            };
        };

        public func postupgrade(upgradeData : UpgradeData<EventT>) {
            queue := refreshQueue(upgradeData.queue);
            events := TrieMap.fromEntries(upgradeData.events.vals(), Text.equal, Text.hash);
        };

        private func prepareEventsForUpgrade() : [(EventId, EventProcessingInfo<EventT>)] {
            return Array.reverse(Iter.toArray(events.entries()));
        };

        private func prepareQueueForUpgrade() : [EventId] {
            var upgradeData = List.fromArray<EventId>([]);

            label copyQueue while (Deque.isEmpty(queue) == false) {
                switch (Deque.popFront(queue)) {
                    case null { continue copyQueue };
                    case (?(eventId, newQueue)) {
                        queue := newQueue;
                        upgradeData := List.append(upgradeData, List.fromArray([eventId]));
                    };
                };
            };

            return List.toArray(upgradeData);
        };

        private func refreshQueue(upgradeData : [EventId]) : Deque.Deque<EventId> {
            for (eventId in upgradeData.vals()) {
                queue := Deque.pushBack<EventId>(queue, eventId);
            };

            return queue;
        };

        private func notifySubscribers(event : EventT) : () {
            for (subscriber in List.toIter(subscribers)) {
                subscriber.listener(event);
            };
        };

        private func addEventToQueue(event : EventT) {
            let eventId = adapter.getEventId(event);
            queue := Deque.pushBack<EventId>(queue, eventId);
        };

        private func createEventProcessingInfo(event : EventT) : EventProcessingInfo<EventT> {
            return {
                event;
                status = #pending;
                processedAt = null;
            };
        };

        private func saveEventProcessingInfo(event : EventProcessingInfo<EventT>) {
            let history = DEFAULT_EVENT_STATUS;
            let eventId = adapter.getEventId(event.event);

            events.put(
                eventId,
                event,
            );
        };

        private func changeEventStatus(eventId : EventId, status : EventStatus) {
            let event = switch (events.get(eventId)) {
                case null { return };
                case (?event) { event };
            };
            let updatedEvent = { event with status };

            events.put(eventId, updatedEvent);
        };

        private func getEventProcessingInfo(eventId : EventId) : ?EventProcessingInfo<EventT> {
            return events.get(eventId);
        };

        private func getEvent(eventId : EventId) : ?EventT {
            let event = switch (events.get(eventId)) {
                case null { null };
                case (?event) { ?event.event };
            };

            return event;
        };

        private func getEventStatus(eventId : EventId) : ?EventStatus {
            let status = switch (events.get(eventId)) {
                case null { null };
                case (?event) { ?event.status };
            };

            return status;
        };

        private func advanceQueue() {
            switch (Deque.popFront<EventId>(queue)) {
                case null {};
                case (?(popped, newEvents)) {
                    queue := newEvents;
                };
            };
        };
    };
};
