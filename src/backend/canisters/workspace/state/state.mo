import Map "mo:map/Map";
import Nat "mo:base/Nat";

import ActivitiesTypes "../../../lib/activities/Types";
import BlocksTypes "../../../lib/blocks/Types";

module State {
    type PrimaryKey = BlocksTypes.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;

    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data() {
        public var blocks = Map.new<PrimaryKey, ShareableBlock>();
        public var activities = Map.new<Nat, ActivitiesTypes.ShareableActivity>();
        public var activityIdCounter = 0;
    };
};
