import Debug "mo:base/Debug";
import Deque "mo:base/Deque";
import List "mo:base/List";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

module {
    private let TARGET_ID_COUNT = 100;

    public class UUIDGenerator() {
        private var queue = Deque.empty<UUID.UUID>();

        public func next() : UUID.UUID {
            let uuid = Deque.popFront<UUID.UUID>(queue);

            switch (uuid) {
                case (null) { Debug.trap("No available uuids") };
                case (?(popped, updatedQueue)) {
                    queue := updatedQueue;
                    return popped;
                };
            };
        };

        public func generateIds() : async () {
            while (List.size(queue.0) < TARGET_ID_COUNT) {
                queue := Deque.pushBack<UUID.UUID>(queue, await Source.Source().new());
            };

            return;
        };
    };

};
