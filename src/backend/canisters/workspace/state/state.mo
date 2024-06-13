import Map "mo:map/Map";
import Nat "mo:base/Nat";

import ActivitiesTypes "../../../lib/activities/types";
import BlocksTypes "../../../lib/blocks/types";
import Collection "../../../utils/data/database/collection/collection";

module State {
    type PrimaryKey = BlocksTypes.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;
    type ShareableActivity = ActivitiesTypes.ShareableActivity;

    public func init() : State {
        return State(Data());
    };

    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data() {
        type Collection<T> = Collection.Collection<T>;

        public var blocks = Collection.Collection<ShareableBlock>();
        public var activities = Collection.Collection<ShareableActivity>();
        public var activityIdCounter = 0;
    };
};
