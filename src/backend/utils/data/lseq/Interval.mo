import Array "mo:base/Array";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Bool "mo:base/Bool";
import Result "mo:base/Result";
import Order "mo:base/Order";
import Buffer "mo:base/Buffer";
import Nat16 "mo:base/Nat16";
import Int16 "mo:base/Int16";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Random "mo:base/Random";
import Types "./types";
import NodeIdentifier "NodeIdentifier";
import Float "mo:base/Float";
import Int64 "mo:base/Int64";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Base "Base";

module Interval {
    type NodeIndex = Types.NodeIndex;

    public class Interval(initial : [NodeIndex]) {
        public let value = initial;

        public func isAllZeros() : Bool {
            let intervalAsBuffer = Buffer.fromArray<NodeIndex>(value);
            Buffer.forAll<NodeIndex>(intervalAsBuffer, func x { x == 0 });
        };

        public func show() : Text {
            return "Interval(" # debug_show (value) # ")";
        };
    };

    public func toInt(interval : Interval) : Nat {
        let value = interval.value;
        var total : Nat = 0;

        label doLoop for (i in Iter.range(0, Array.size(value) - 1)) {
            let index = Int.abs(i);
            let depth = Nat16.fromNat(index + 1);
            let baseAtdepth : Nat = Nat16.toNat(Base.at(depth));
            total := total + (Nat16.toNat(value[index]) * baseAtdepth);
        };

        return total;
    };

    public func toBuffer(interval : Interval) : Buffer.Buffer<NodeIndex> {
        return Buffer.fromArray<NodeIndex>(interval.value);
    };

    public func fromBuffer(buffer : Buffer.Buffer<NodeIndex>) : Interval {
        return Interval(Buffer.toArray(buffer));
    };

    public func between(prefixA : [NodeIndex], prefixB : [NodeIndex]) : Interval {
        if (Array.size(prefixA) != Array.size(prefixB)) {
            Debug.trap("Prefixes must be of equal length");
        };

        let updatedIntervalValue = Buffer.fromArray<NodeIndex>([]);
        var borrowedAmount : Nat16 = 0;
        var intervalAsBuffer = Buffer.fromArray<NodeIndex>([]);
        var hasBorrowed = false;

        func _calculateValueAtIndex(
            index : Nat16,
            valueAtIndex : { var a : NodeIndex; var b : NodeIndex },
            borrowedAmount : Nat16,
            // onSuccess : (newValue : number, borrowedAmount : number) = > void,
        ) : (Nat16, Nat16) {
            let base = Base.at(index);
            var borrowed : Nat16 = borrowedAmount;

            if (valueAtIndex.a > valueAtIndex.b and index == 0) Debug.trap("Prefix A must be less than prefix B");

            if (valueAtIndex.a > valueAtIndex.b) {
                let amountToBorrow : Nat16 = 1;

                // Borrow from the next index
                valueAtIndex.b += base;
                borrowed := amountToBorrow;
            };

            let newValue = valueAtIndex.b - valueAtIndex.a;
            if (newValue < 0) Debug.trap("Out of bounds");

            return (newValue, borrowed);
        };

        label doLoop for (i in Iter.revRange(prefixA.size() - 1, 0)) {
            let valueAtIndex = {
                var a = prefixA[Int.abs(i)];
                var b = prefixB[Int.abs(i)];
            };

            if (borrowedAmount < 0) {
                Debug.trap("Borrowed amount must be greater than or equal to 0");
            };

            // Handle borrowing
            if (borrowedAmount > 0) {
                valueAtIndex.b := valueAtIndex.b - borrowedAmount;
                borrowedAmount := 0;

                let (val, borrowed) = _calculateValueAtIndex(
                    Nat16.fromNat(Int.abs(i)),
                    valueAtIndex,
                    borrowedAmount,
                );

                updatedIntervalValue.insert(0, val);
                borrowedAmount := borrowed;

                continue doLoop;
            };

            let (val, borrowed) = _calculateValueAtIndex(
                Nat16.fromNat(Int.abs(i)),
                valueAtIndex,
                borrowedAmount,
            );

            updatedIntervalValue.insert(0, val);
            borrowedAmount := borrowed;
        };

        let finalInterval = fromBuffer(updatedIntervalValue);

        if (finalInterval.isAllZeros()) {
            return finalInterval;
        };

        let final = subtract(finalInterval, 1);
        return final;
    };

    public func subtract(interval : Interval, constant : NodeIndex) : Interval {
        let intervalValue = interval.value;

        if (intervalValue.size() == 0) {
            Debug.trap("Interval must not be empty");
        };

        if (intervalValue.size() == 1) {
            if (intervalValue[0] < constant) {
                Debug.trap("Interval must be greater than or equal to constant");
            };
            return Interval([intervalValue[0] - constant]);
        };

        var updatedIntervalValue = Buffer.fromArray<NodeIndex>([]);
        var hasBorrowed = false;

        label doLoop for (i in Iter.revRange(intervalValue.size() - 1, 0)) {
            let index = Int.abs(i);
            var valueAtIndex = intervalValue.get(index);

            if (hasBorrowed == true) {
                let borrowedAmount : Int16 = 1;
                let valueMinusBorrowedAmount : Int16 = Int16.fromNat16(valueAtIndex) - borrowedAmount;

                if (valueMinusBorrowedAmount < 0) {
                    if (index == 0) {
                        Debug.trap("Out of bounds");
                    };
                    // Borrow from the next index
                    valueAtIndex := valueAtIndex + Base.at(Nat16.fromNat(index)) - 1;
                    hasBorrowed := true;
                } else {
                    valueAtIndex := valueAtIndex - 1;
                    hasBorrowed := false;
                };
            };

            let isLastItem = index == intervalValue.size() - 1;

            if (isLastItem) {
                if (constant > valueAtIndex) {
                    // Borrow from the next index
                    valueAtIndex := valueAtIndex + Base.at(Nat16.fromNat(index));
                    hasBorrowed := true;
                    updatedIntervalValue.insert(0, valueAtIndex - constant);
                    continue doLoop;
                };
                updatedIntervalValue.insert(0, valueAtIndex - constant);
                continue doLoop;
            } else {
                updatedIntervalValue.insert(0, valueAtIndex);

            };

        };

        return fromBuffer(updatedIntervalValue);
    };
};
