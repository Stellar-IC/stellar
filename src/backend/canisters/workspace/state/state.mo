import Buffer "mo:base/Buffer";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

import Map "mo:map/Map";

import ActivitiesTypes "../../../lib/activities/Types";
import BlocksTypes "../../../lib/blocks/Types";

import Types "../types/v2";

module State {
    type PrimaryKey = BlocksTypes.PrimaryKey;
    type ShareableBlock = BlocksTypes.ShareableBlock;

    type OfferId = Nat;

    public class State(_data : Data) {
        public var data = _data;
    };

    public class Data() {
        public var blocks = Map.new<PrimaryKey, ShareableBlock>();

        public var activities = Map.new<Nat, ActivitiesTypes.ShareableActivity>();
        public var activitiesIdCounter = 0;

        public var activeUsers : [Principal] = [];
        public var activeUsersByPage = Map.new<Text, [Principal]>();
        public var activeUserTimers = Map.new<Principal, Nat>();
    };
};
