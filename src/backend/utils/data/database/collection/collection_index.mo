import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Order "mo:base/Order";
import Buffer "mo:base/Buffer";
import Map "mo:map/Map";

import StableBuffer "mo:stablebuffer/StableBuffer";

import Types "./types";

module CollectionIndex {
    type PrimaryKey = Types.PrimaryKey;

    type IndexKey = Text;
    type IndexValue = StableBuffer.StableBuffer<PrimaryKey>;

    /**
    * Represents a database index. An index is a mapping from an attribute
    * value to a list of primary keys. The primary keys are used to retrieve
    * the actual objects from the database.
    **/
    public class CollectionIndex() {
        public let data = Map.new<IndexKey, IndexValue>();
    };

    public func get(index : CollectionIndex, key : IndexKey) : Iter.Iter<PrimaryKey> {
        var ids = switch (Map.get(index.data, Map.thash, key)) {
            case (null) { StableBuffer.fromArray<PrimaryKey>([]) };
            case (?ids) { ids };
        };

        return StableBuffer.vals(ids);
    };

    public func put(index : CollectionIndex, key : Text, pk : PrimaryKey) : () {
        let pks = get(index, key);

        switch (_valueAtKey(index, key)) {
            case (null) {
                let ids = StableBuffer.make<PrimaryKey>(pk);
                ignore Map.put(index.data, Map.thash, key, ids);
            };
            case (?ids) {
                if (StableBuffer.contains(ids, pk, Text.equal)) {
                    return;
                };

                StableBuffer.add(ids, pk);
            };
        };
    };

    public func remove(index : CollectionIndex, key : Text, pk : PrimaryKey) : () {
        switch (_valueAtKey(index, key)) {
            case (null) { return };
            case (?ids) {
                StableBuffer.filterEntries<PrimaryKey>(
                    ids,
                    func(_, id) { id != pk },
                );
            };
        };
    };

    private func _valueAtKey(index : CollectionIndex, key : IndexKey) : ?IndexValue {
        switch (Map.get(index.data, Map.thash, key)) {
            case (null) { return null };
            case (?ids) { return ?ids };
        };
    };
};
