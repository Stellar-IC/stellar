import Debug "mo:base/Debug";
import T "mo:matchers/Testable";
import UUID "mo:uuid/UUID";

import Activity "../lib/activities/activity";
import ActivitiesTypes "../lib/activities/types";
import Block "../lib/blocks/block";
import BlocksTypes "../lib/blocks/types";
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
