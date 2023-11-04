import List "mo:base/List";
module {
    type CanisterEvent = {
        #userCanisterCreated : {
            eventName : { #userCanisterCreated };
            canister : actor {};
        };
    };

    public type EventListener<EventT> = (event : EventT) -> ();

    public type Subscriber<EventT> = {
        name : Text;
        listener : EventListener<EventT>;
    };

    var subscribers = List.fromArray<Subscriber<EventT>>([]);

    public class EventStream<EventT>() {
        var subscribers = List.fromArray<Subscriber<EventT>>([]);

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
            for (subscriber in List.toIter(subscribers)) {
                subscriber.listener(event);
            };
        };
    };

    public let sharedEventStream = EventStream<CanisterEvent>();
};
