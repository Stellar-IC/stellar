import Types "./types";
import Order "mo:base/Order";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Nat16 "mo:base/Nat16";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Base "Base";

module {
    private type NodeIndex = Types.NodeIndex;

    public class Identifier(_value : [Types.NodeIndex]) {
        public let value = _value;

        public func length() : Nat {
            return Array.size<NodeIndex>(value);
        };
    };

    /**
     * Compare two node identifiers.
     *
     * @param identifierA The first node to compare.
     * @param identifierB The second node to compare.
     * @return The result of the comparison.
     */
    public func compare(identifierA : Identifier, identifierB : Identifier) : Order.Order {
        let identifierALength = identifierA.length();
        let identifierBLength = identifierB.length();

        if (identifierALength == 0 and identifierBLength == 0) {
            if (identifierALength == identifierBLength) {
                return #equal;
            } else if (identifierALength > identifierBLength) {
                return #greater;
            } else {
                return #less;
            };
        };

        let isNode1LongestNode = identifierALength > identifierBLength;
        let areNodesEqualLength = identifierALength == identifierBLength;
        let shorterNodeLength : Nat = switch (isNode1LongestNode) {
            case (true) { identifierBLength - 1 };
            case (false) { identifierALength -1 };
        };

        label doLoop for (i in Iter.range(0, shorterNodeLength)) {
            let identifierAPart = identifierA.value[i];
            let identifierBPart = identifierB.value[i];

            if (identifierAPart == identifierBPart) {
                continue doLoop;
            } else if (identifierAPart > identifierBPart) {
                return #greater;
            } else {
                return #less;
            };
        };

        if (isNode1LongestNode) {
            return #greater;
        };

        if (areNodesEqualLength) {
            return #equal;
        };

        return #less;
    };

    public func compareByLength(identifierA : Identifier, identifierB : Identifier) : Order.Order {
        if (identifierA.length() < identifierB.length()) {
            return #less;
        };
        if (identifierA.length() > identifierB.length()) {
            return #greater;
        };
        return #equal;
    };

    /**
     * Compare two nodes for equality.
     *
     * This function will compare two nodes based on their identifiers.
     *
     * @param node1 The first node to compare.
     * @param node2 The second node to compare.
     * @return The result of the comparison.
     */
    public func equal(identifierA : Identifier, identifierB : Identifier) : Bool {
        return compare(identifierA, identifierB) == #equal;
    };

    public func subtract(
        identifier : Identifier,
        constant : NodeIndex,
    ) : Identifier {
        let identifierValue = identifier.value;
        let identifierLength = identifier.length();

        if (identifierLength == 0) {
            Debug.trap("Identifier must not be empty");
        };

        if (constant > Base.at(Nat16.fromNat(identifierLength) - 1)) {
            Debug.trap(
                "Constant must be less than or equal to base at deepest level"
            );
        };

        if (identifierLength == 1) {
            if (identifierValue[0] < constant) Debug.trap("Out of bounds");

            return Identifier([identifierValue[0] - constant]);
        };

        let updatedIntervalValue = Buffer.fromArray<NodeIndex>([]);
        var borrowedAmount : Nat16 = 0;
        var tempConstant = constant;

        label doLoop for (i in Iter.revRange(identifierLength - 1, 0)) {
            let idx = Int.abs(i);
            var valueAtIndex = identifierValue[idx];
            let base = Base.at(Nat16.fromNat(idx));

            if (borrowedAmount < 0) Debug.trap("Borrowed amount cannot be less than 0");

            // Handle borrowing
            if (borrowedAmount > 0) {
                valueAtIndex := valueAtIndex - borrowedAmount;
                borrowedAmount := 0;

                if (tempConstant > valueAtIndex) {
                    let amountToBorrow : Nat16 = 1;

                    // Borrow from the next index
                    valueAtIndex := identifierValue[idx] - 1 + base;
                    borrowedAmount := amountToBorrow;
                };

                let newValue = valueAtIndex - tempConstant;
                if (newValue < 0) Debug.trap("Out of bounds");

                updatedIntervalValue.insert(0, newValue);
                tempConstant := 0;

                continue doLoop;
            };

            if (tempConstant > valueAtIndex) {
                let amountToBorrow : Nat16 = 1;

                // Borrow from the next index
                valueAtIndex := identifierValue[idx] + base;
                borrowedAmount := amountToBorrow;
            };

            let newValue = valueAtIndex - tempConstant;
            if (newValue < 0) Debug.trap("Out of bounds");

            updatedIntervalValue.insert(0, newValue);
            tempConstant := 0;
        };

        return Identifier(Buffer.toArray(updatedIntervalValue));
    };
};
