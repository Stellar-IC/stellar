import Principal "mo:base/Principal";
import Map "mo:map/Map";
import StableBuffer "mo:stablebuffer/StableBuffer";

module PubSub {
    type EventName = Text;
    type SubscriptionHandlerMap<DataT, HandlerT> = Map.Map<Principal, HandlerT>;
    type SubscriberMap<DataT, HandlerT> = Map.Map<EventName, SubscriptionHandlerMap<DataT, HandlerT>>;

    public class Publisher<DataT, HandlerT>() {
        public let subscribers : SubscriberMap<DataT, HandlerT> = Map.new();
    };

    public func subscribe<DataT, HandlerT>(
        publisher : Publisher<DataT, HandlerT>,
        subscriber : Principal,
        eventName : EventName,
        eventHandler : HandlerT,
    ) : () {
        let subscribers = publisher.subscribers;
        let subscriptionsForEvent = Map.get(subscribers, Map.thash, eventName);

        switch (subscriptionsForEvent) {
            case (null) {
                // No subscriptions for this event yet, create a new map
                let handlersBySubscriber : SubscriptionHandlerMap<DataT, HandlerT> = Map.new();
                ignore Map.put(handlersBySubscriber, Map.phash, subscriber, eventHandler);
                ignore Map.put(subscribers, Map.thash, eventName, handlersBySubscriber);
            };
            case (?subscriptions) {
                ignore Map.put(subscriptions, Map.phash, subscriber, eventHandler);
            };
        };
    };

    public func publish<DataT, HandlerT>(
        publisher : Publisher<DataT, HandlerT>,
        eventName : EventName,
        data : DataT,
        publishFn : (handler : HandlerT, eventName : EventName, data : DataT) -> async (),
    ) : async () {
        let subscribers = Map.get(publisher.subscribers, Map.thash, eventName);

        switch (subscribers) {
            case (null) {};
            case (?subscribers) {
                let subscriptions = Map.entries(subscribers);
                for (subscription in subscriptions) {
                    let handler = subscription.1;
                    ignore publishFn(handler, eventName, data);
                };
            };
        };
    };
};
