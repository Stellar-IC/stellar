import Debug "mo:base/Debug";
import T "mo:matchers/Testable";
import UUID "mo:uuid/UUID";

import Activity "../lib/activities/Activity";
import ActivitiesTypes "../lib/activities/Types";
import Block "../lib/blocks/Block";
import BlocksTypes "../lib/blocks/Types";
import UUIDUtils "../utils/uuid";

module {
    public func getUuid(t : Text) : UUID.UUID {
        switch (UUIDUtils.fromText(t)) {
            case (#err(msg)) { Debug.trap(msg) };
            case (#ok(uuid)) { uuid };
        };
    };

    public let activityTestable : T.Testable<ActivitiesTypes.Activity> = {
        display = Activity.toText;
        equals = Activity.compare;
    };

    public func activity(a : ActivitiesTypes.Activity) : T.TestableItem<ActivitiesTypes.Activity> {
        {
            display = Activity.toText;
            equals = Activity.compare;
            item = a;
        };
    };

    public let blockTestable : T.Testable<BlocksTypes.Block> = {
        display = Block.toText;
        equals = Block.compare;
    };

    public func block(b : BlocksTypes.Block) : T.TestableItem<BlocksTypes.Block> {
        {
            display = Block.toText;
            equals = Block.compare;
            item = b;
        };
    };

};
