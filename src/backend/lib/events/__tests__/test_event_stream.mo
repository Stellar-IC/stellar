import Array "mo:base/Array";
import Bool "mo:base/Bool";
import Debug "mo:base/Debug";
import HM "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Matchers "mo:matchers/Matchers";
import HMMatchers "mo:matchers/matchers/Hashmap";
import T "mo:matchers/Testable";
import Suite "mo:matchers/Suite";

import EventStream "../event_stream";
import Types "../types";
import Builders "./builders";

type MockEvent = {
    id : Text;
};

type EventId = Types.EventId;
type EventProcessingInfo = Types.EventProcessingInfo<MockEvent>;

class MockEventBuilder() = self {
    var event : MockEvent = { id = "1" };

    public func withId(id : Text) : MockEventBuilder {
        event := { event with id = id };
        return self;
    };

    public func build() : MockEvent {
        return event;
    };
};

func getEventId(event : MockEvent) : Text {
    return event.id;
};

func waitFor(predicate : () -> Bool) : () {
    let startTime = Time.now();
    var maxIterations : Int = 100;
    var event : Text = "";

    while (maxIterations > 0 and predicate() == false) {
        maxIterations := maxIterations - 1;
    };

    if (maxIterations == 0) {
        Debug.trap("Waited too long for predicate to be true");
    };
};

let upgradeDataTestable = {
    display = func((eventId : EventId, info : EventProcessingInfo)) : Text {
        return "(" # eventId # ", " # debug_show (info) # ")";
    };
    equals = func(
        t1 : (eventId : EventId, info : EventProcessingInfo),
        t2 : (eventId : EventId, info : EventProcessingInfo),
    ) : Bool {
        return t1 == t2;
    };
};

let suite = Suite.suite(
    "EventStream",
    [
        Suite.suite(
            "publish",
            [
                Suite.testLazy<[Text]>(
                    "Should publish event to all listeners",
                    func testPublishesEventToAllListeners() : [Text] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        let event = MockEventBuilder().build();
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });
                        let listenerCount = 3;

                        for (i in Iter.range(0, listenerCount - 1)) {
                            eventStreamBuilder := eventStreamBuilder.withEventListener(
                                "Listener" # Nat.toText(i),
                                func saveEventId(event : MockEvent) {
                                    final := List.append(final, List.fromArray(["L" # debug_show i # ": " #event.id]));
                                    return;
                                },
                            );
                        };

                        let eventStream = eventStreamBuilder.build();
                        eventStream.publish(event);
                        eventStream.processEvents();

                        waitFor(
                            func() {
                                return List.size(final) == listenerCount;
                            }
                        );

                        return List.toArray(final);
                    },
                    Matchers.equals(
                        T.array<Text>(
                            T.textTestable,
                            ["L0: 1", "L1: 1", "L2: 1"],
                        )
                    ),
                ),
                Suite.testLazy<[Text]>(
                    "Should publish multiple events to all listeners",
                    func testPublishesMultipleEventsToAllListeners() : [Text] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });
                        let listenerCount = 3;

                        for (i in Iter.range(0, listenerCount - 1)) {
                            eventStreamBuilder := eventStreamBuilder.withEventListener(
                                "Listener" # Nat.toText(i),
                                func saveEventId(event : MockEvent) {
                                    final := List.append(final, List.fromArray(["L" # debug_show i # ": " #event.id]));
                                    return;
                                },
                            );
                        };

                        let eventStream = eventStreamBuilder.build();
                        eventStream.publish(MockEventBuilder().withId("1").build());
                        eventStream.publish(MockEventBuilder().withId("2").build());
                        eventStream.publish(MockEventBuilder().withId("3").build());
                        eventStream.processEvents();

                        assert List.size(final) == listenerCount * 3;

                        return List.toArray(final);
                    },
                    Matchers.equals(
                        T.array<Text>(
                            T.textTestable,
                            [
                                "L0: 1",
                                "L1: 1",
                                "L2: 1",
                                "L0: 2",
                                "L1: 2",
                                "L2: 2",
                                "L0: 3",
                                "L1: 3",
                                "L2: 3",
                            ],
                        )
                    ),
                ),
                Suite.testLazy<[Text]>(
                    "Should not publish event to removed listener",
                    func() : [Text] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        let listenerCount : Int = 3;
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });

                        for (i in Iter.range(0, listenerCount - 1)) {
                            eventStreamBuilder := eventStreamBuilder.withEventListener(
                                "Listener" # Nat.toText(i),
                                func saveEventId(event : MockEvent) {
                                    final := List.append(final, List.fromArray(["L" # debug_show i # ": " #event.id]));
                                    return;
                                },
                            );
                        };

                        let eventStream = eventStreamBuilder.build();
                        eventStream.removeEventListener("Listener1");
                        eventStream.publish(MockEventBuilder().withId("1").build());
                        eventStream.processEvents();

                        waitFor(
                            func() {
                                return List.size(final) == listenerCount - 1;
                            }
                        );

                        return List.toArray(final);
                    },
                    Matchers.equals(
                        T.array<Text>(
                            T.textTestable,
                            ["L0: 1", "L2: 1"],
                        )
                    ),
                ),
                Suite.testLazy<[Text]>(
                    "Should not process event more than once",
                    func() : [Text] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        let listenerCount : Int = 3;
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });

                        for (i in Iter.range(0, listenerCount - 1)) {
                            eventStreamBuilder := eventStreamBuilder.withEventListener(
                                "Listener" # Nat.toText(i),
                                func saveEventId(event : MockEvent) {
                                    final := List.append(final, List.fromArray(["L" # debug_show i # ": " #event.id]));
                                    return;
                                },
                            );
                        };

                        let eventStream = eventStreamBuilder.build();
                        eventStream.publish(MockEventBuilder().withId("1").build());
                        eventStream.processEvents();
                        eventStream.processEvents();

                        return List.toArray(final);
                    },
                    Matchers.equals(
                        T.array<Text>(
                            T.textTestable,
                            ["L0: 1", "L1: 1", "L2: 1"],
                        )
                    ),
                ),
            ],
        ),
        Suite.suite(
            "preupgrade",
            [
                Suite.testLazy<[(EventId, EventProcessingInfo)]>(
                    "Should return events",
                    func() : [(EventId, EventProcessingInfo)] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        let listenerCount : Int = 3;
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });

                        let eventStream = eventStreamBuilder.build();
                        eventStream.publish(MockEventBuilder().withId("1").build());
                        eventStream.publish(MockEventBuilder().withId("2").build());

                        let upgradeData = eventStream.preupgrade();

                        return upgradeData.events;
                    },
                    Matchers.equals<[(EventId, EventProcessingInfo)]>(
                        T.array<(EventId, EventProcessingInfo)>(
                            upgradeDataTestable,
                            [
                                ("1", { event = { id = "1" }; processedAt = null; status = #pending }),
                                ("2", { event = { id = "2" }; processedAt = null; status = #pending }),
                            ],
                        )
                    ),
                ),
                Suite.testLazy<[EventId]>(
                    "Should return ids of queued events",
                    func() : [EventId] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        let listenerCount : Int = 3;
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });

                        let eventStream = eventStreamBuilder.build();
                        eventStream.publish(MockEventBuilder().withId("1").build());
                        eventStream.publish(MockEventBuilder().withId("2").build());

                        let upgradeData = eventStream.preupgrade();

                        return upgradeData.queue;
                    },
                    Matchers.equals<[EventId]>(
                        T.array<EventId>(
                            T.textTestable,
                            ["1", "2"],
                        )
                    ),
                ),
            ],
        ),
        Suite.suite(
            "postupgrade",
            [
                Suite.testLazy<[EventId]>(
                    "Should restore events",
                    func() : [EventId] {
                        var final : List.List<Text> = List.fromArray<Text>([]);
                        let listenerCount : Int = 3;
                        var eventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });

                        let eventStream = eventStreamBuilder.build();
                        eventStream.publish(MockEventBuilder().withId("1").build());
                        eventStream.publish(MockEventBuilder().withId("2").build());

                        let upgradeData = eventStream.preupgrade();
                        var newEventStreamBuilder = Builders.EventStreamBuilder<MockEvent>().withAdapter({
                            getEventId;
                        });

                        for (i in Iter.range(0, listenerCount - 1)) {
                            newEventStreamBuilder := newEventStreamBuilder.withEventListener(
                                "Listener" # Nat.toText(i),
                                func saveEventId(event : MockEvent) {
                                    final := List.append(final, List.fromArray(["L" # debug_show i # ": " #event.id]));
                                    return;
                                },
                            );
                        };

                        let newEventStream = newEventStreamBuilder.build();
                        newEventStream.postupgrade(upgradeData);
                        newEventStream.processEvents();

                        return List.toArray(final);
                    },
                    Matchers.equals<[EventId]>(
                        T.array<EventId>(
                            T.textTestable,
                            ["L0: 1", "L1: 1", "L2: 1", "L0: 2", "L1: 2", "L2: 2"],
                        )
                    ),
                ),
            ],
        ),
    ],
);

Suite.run(suite);
