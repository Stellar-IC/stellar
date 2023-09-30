import Tree "../Tree";
import Types "../types";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";

module Mocks {
    public let hello : [{
        identifier : Types.NodeIdentifier;
        value : Types.NodeValue;
    }] = [
        {
            identifier = [1];
            value = "h";
        },
        {
            identifier = [4];
            value = "e";
        },
        {
            identifier = [4, 3];
            value = "l";
        },
        {
            identifier = [4, 15];
            value = "l";
        },
        {
            identifier = [4, 15, 31];
            value = "o";
        },
    ];

    public func getAvailableIdentifiersForHello() : [Types.NodeIdentifier] {
        var available = Buffer.fromArray<Types.NodeIdentifier>([]);

        for (i in Iter.range(0, 15)) {
            let iIndex : Nat16 = Nat16.fromNat(i);
            if (iIndex != 1 and iIndex != 4) {
                available.append(Buffer.fromArray<Types.NodeIdentifier>([[iIndex]]));
            };

            if (iIndex == 1) {
                for (j in Iter.range(0, 31)) {
                    let jIndex : Nat16 = Nat16.fromNat(j);
                    available.append(Buffer.fromArray<Types.NodeIdentifier>([[iIndex, jIndex]]));
                };
            };

            if (iIndex == 4) {
                for (j in Iter.range(0, 31)) {
                    let jIndex : Nat16 = Nat16.fromNat(j);
                    if (jIndex != 3 and jIndex != 15) {
                        available.append(Buffer.fromArray<Types.NodeIdentifier>([[iIndex, jIndex]]));
                    };

                    if (jIndex == 3) {
                        for (k in Iter.range(0, 63)) {
                            let kIndex : Nat16 = Nat16.fromNat(k);
                            available.append(Buffer.fromArray<Types.NodeIdentifier>([[iIndex, jIndex, kIndex]]));
                        };
                    };

                    if (jIndex == 15) {
                        for (k in Iter.range(0, 63)) {
                            let kIndex : Nat16 = Nat16.fromNat(k);
                            if (kIndex != 31) {
                                available.append(Buffer.fromArray<Types.NodeIdentifier>([[iIndex, jIndex, kIndex]]));
                            };

                            if (kIndex == 31) {
                                for (l in Iter.range(0, 127)) {
                                    let lIndex : Nat16 = Nat16.fromNat(l);
                                    available.append(Buffer.fromArray<Types.NodeIdentifier>([[iIndex, jIndex, kIndex, lIndex]]));
                                };
                            };
                        };
                    };
                };
            };
        };

        return Buffer.toArray<Types.NodeIdentifier>(available);
    };

    public let helloWorld : [{
        identifier : Types.NodeIdentifier;
        value : Types.NodeValue;
    }] = [
        {
            identifier = [1];
            value = "h";
        },
        {
            identifier = [4];
            value = "e";
        },
        {
            identifier = [4, 3];
            value = "l";
        },
        {
            identifier = [4, 15];
            value = "l";
        },
        {
            identifier = [4, 15, 31];
            value = "o";
        },
        {
            identifier = [7];
            value = " ";
        },
        {
            identifier = [8];
            value = "w";
        },
        {
            identifier = [8, 6];
            value = "o";
        },
        {
            identifier = [8, 9];
            value = "r";
        },
        {
            identifier = [12];
            value = "l";
        },
        {
            identifier = [12, 4];
            value = "d";
        },
        {
            identifier = [13];
            value = "!";
        },
    ];
};
