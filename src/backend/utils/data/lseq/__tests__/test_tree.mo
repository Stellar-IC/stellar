import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

import Matchers "mo:matchers/Matchers";
import { assertThat } "mo:matchers/Matchers";
import Testable "mo:matchers/Testable";

import Test "../../../test";
import TestRunner "../../../test/test_runner";

import Interval "../Interval";
import Node "../Node";
import NodeIdentifier "../NodeIdentifier";
import Tree "../Tree";
import Types "../types";

import Mocks "./mocks";

module TestTree {
    public func run(r : TestRunner.TestRunner, caller : Principal) : async () {
        var id_counter = 0;

        await r.describe(
            "Tree",
            func() : async () {
                /********************
                * prefix
                *********************/
                await r.describe(
                    "prefix",
                    func() : async () {
                        await r.it(
                            "should return the correct prefix",
                            func() : async Test.TestResult {
                                let tree = Tree.Tree(null);
                                let insertResult = tree.insertMany(Mocks.hello);
                                switch (insertResult) {
                                    case (#err(err)) {
                                        Debug.trap(debug_show (err));
                                    };
                                    case (#ok) {};
                                };

                                assertThat(
                                    Tree.prefix([], 0),
                                    Matchers.equals(
                                        Testable.array<Types.NodeIndex>(
                                            Testable.nat16Testable,
                                            [],
                                        )
                                    ),
                                );
                                assertThat(
                                    Tree.prefix([1, 2, 3], 1),
                                    Matchers.equals(
                                        Testable.array<Types.NodeIndex>(
                                            Testable.nat16Testable,
                                            [1],
                                        )
                                    ),
                                );
                                assertThat(
                                    Tree.prefix([4, 3, 15], 1),
                                    Matchers.equals(
                                        Testable.array<Types.NodeIndex>(
                                            Testable.nat16Testable,
                                            [4],
                                        )
                                    ),
                                );
                                assertThat(
                                    Tree.prefix([4, 3, 15], 2),
                                    Matchers.equals(
                                        Testable.array<Types.NodeIndex>(
                                            Testable.nat16Testable,
                                            [4, 3],
                                        )
                                    ),
                                );
                                assertThat(
                                    Tree.prefix([4, 3, 15], 4),
                                    Matchers.equals(
                                        Testable.array<Types.NodeIndex>(
                                            Testable.nat16Testable,
                                            [4, 3, 15, 0],
                                        )
                                    ),
                                );
                                assertThat(
                                    Tree.prefix([4, 3, 15, 64], 4),
                                    Matchers.equals(
                                        Testable.array<Types.NodeIndex>(
                                            Testable.nat16Testable,
                                            [4, 3, 15, 64],
                                        )
                                    ),
                                );
                                #ok;
                            },
                        );
                    },
                );

                /********************
                * insert
                *********************/
                await r.describe(
                    "insert",
                    func() : async () {
                        await r.it(
                            "should fail if node exists already",
                            func() : async Test.TestResult {
                                let tree = Tree.Tree(null);
                                ignore tree.insert(Node.Node([1], "h"));
                                let result = tree.insert(Node.Node([1], "f"));
                                switch (result) {
                                    case (#err(#identifierAlreadyInUse)) {
                                        return #ok;
                                    };
                                    case (#err(err)) {
                                        return #err(#failedTest(?("Expected to fail with #err(#identifierAlreadyInUse), but got: " # debug_show (err))));
                                    };
                                    case (#ok) {
                                        return #err(#failedTest(?("Expected to fail with #identifierAlreadyInUse")));
                                    };
                                };
                                #ok;
                            },
                        );

                        await r.it(
                            "should fail if node identifier is past the allotted base",
                            func() : async Test.TestResult {
                                let tree = Tree.Tree(null);
                                let result = tree.insert(Node.Node([16], "f"));
                                switch (result) {
                                    case (#err(#invalidIdentifier)) {
                                        return #ok;
                                    };
                                    case (#err(err)) {
                                        return #err(#failedTest(?("Expected to fail with #err(#invalidIdentifier), but got: " # debug_show (err))));
                                    };
                                    case (#ok) {
                                        return #err(#failedTest(?("Expected to fail with #invalidIdentifier")));
                                    };
                                };
                                #ok;
                            },
                        );

                        await r.it(
                            "should fail if insert is out of order",
                            func() : async Test.TestResult {
                                let tree = Tree.Tree(null);
                                ignore tree.insert(Node.Node([1], "h"));
                                let result = tree.insert(Node.Node([1, 3, 1], "f"));
                                switch (result) {
                                    case (#err(#outOfOrder)) {
                                        return #ok;
                                    };
                                    case (#err(err)) {
                                        return #err(#failedTest(?("Expected to fail with #err(#outOfOrder), but got: " # debug_show (err))));
                                    };
                                    case (#ok) {
                                        return #err(#failedTest(?("Expected to fail inserting node")));
                                    };
                                };
                                #ok;
                            },
                        );

                        await r.it(
                            "should successfully insert nodes",
                            func() : async Test.TestResult {
                                let rootIdentifier : Types.NodeIdentifier = [];
                                let tree = Tree.Tree(null);
                                ignore tree.insert(Node.Node([1], "h"));

                                var insertedNode = tree.get([1]);
                                switch (insertedNode) {
                                    case (null) {
                                        return #err(#failedTest(?("Did not find node: " # debug_show ([1]))));
                                    };
                                    case (?insertedNode) {
                                        assertThat(insertedNode.identifier.value, Matchers.equals(Testable.array<Types.NodeIndex>(Testable.nat16Testable, [1])));
                                    };
                                };

                                ignore tree.insert(Node.Node([4], "e"));
                                ignore tree.insert(Node.Node([4, 3], "l"));
                                ignore tree.insert(Node.Node([4, 15], "l"));
                                ignore tree.insert(Node.Node([4, 15, 31], "o"));

                                func assertNodeIsCorrect(node : Node.Node, identifier : Types.NodeIdentifier, value : Text) : () {
                                    assertThat(node.identifier.value, Matchers.equals(Testable.array<Types.NodeIndex>(Testable.nat16Testable, identifier)));
                                    assertThat(node.value, Matchers.equals(Testable.text(value)));
                                };

                                let e_node = tree.get([4]);
                                switch (e_node) {
                                    case (null) {
                                        return #err(#failedTest(?("Did not find node: " # debug_show ([4]))));
                                    };
                                    case (?e_node) {
                                        assertNodeIsCorrect(e_node, [4], "e");
                                        let l1_node = e_node.children.get(3);
                                        let l2_node = e_node.children.get(15);
                                        switch (l1_node) {
                                            case (null) {
                                                return #err(#failedTest(?("Did not find node: " # debug_show ([4, 3]))));
                                            };
                                            case (?l1_node) {
                                                assertNodeIsCorrect(l1_node, [4, 3], "l");
                                            };
                                        };
                                        switch (l2_node) {
                                            case (null) {
                                                return #err(#failedTest(?("Did not find node: " # debug_show ([4, 15]))));
                                            };
                                            case (?l2_node) {
                                                assertNodeIsCorrect(l2_node, [4, 15], "l");
                                                let o_node = l2_node.children.get(31);
                                                switch (o_node) {
                                                    case (null) {
                                                        return #err(#failedTest(?("Did not find node: " # debug_show ([4, 15, 31]))));
                                                    };
                                                    case (?o_node) {
                                                        assertNodeIsCorrect(o_node, [4, 15, 31], "o");
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };

                                #ok;
                            },
                        );
                    },
                );

                /********************
                * get
                *********************/
                await r.describe(
                    "get",
                    func() : async () {
                        await r.it(
                            "should return the correct node",
                            func() : async Test.TestResult {
                                let rootIdentifier : Types.NodeIdentifier = [];
                                let tree = Tree.Tree(null);
                                let nodesToInsert : [{
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

                                for (node in Iter.fromArray(nodesToInsert)) {
                                    ignore tree.insert({
                                        identifier = node.identifier;
                                        value = node.value;
                                    });
                                    let insertedNode = tree.get(node.identifier);
                                    switch (insertedNode) {
                                        case (null) {
                                            return #err(#failedTest(?("Did not find node: " # debug_show (node.identifier))));
                                        };
                                        case (?insertedNode) {
                                            assertThat(insertedNode.identifier.value, Matchers.equals(Testable.array<Types.NodeIndex>(Testable.nat16Testable, node.identifier)));
                                            assertThat(insertedNode.value, Matchers.equals(Testable.text(node.value)));
                                        };
                                    };
                                };

                                #ok;
                            },
                        );
                    },
                );

                /************************
                * subtractFromInterval
                *************************/
                await r.describe(
                    "subtractFromInterval",
                    func() : async () {
                        await r.it(
                            "should return correct value",
                            func() : async Test.TestResult {
                                let variants : [([Types.NodeIndex], Nat16, [Types.NodeIndex])] = [
                                    // ([0], 1, [0]), TODO: Test that this throws
                                    ([1], 1, [0]),
                                    ([1, 0], 1, [0, 31]),
                                    ([1, 0], 2, [0, 30]),
                                    ([1, 0], 3, [0, 29]),
                                    ([1, 0, 0], 1, [0, 31, 63]),
                                    ([0, 1, 0], 1, [0, 0, 63]),
                                    ([4, 3, 15], 3, [4, 3, 12]),

                                ];

                                for (variant in variants.vals()) {
                                    let interval = Interval.Interval(variant.0);
                                    let subtrahend = variant.1;
                                    let expected = variant.2;
                                    let result = Interval.subtract(interval, subtrahend);
                                    assertThat<[Types.NodeIndex]>(
                                        result.value,
                                        Matchers.equals(
                                            Testable.array<Types.NodeIndex>(
                                                Testable.nat16Testable,
                                                expected,
                                            )
                                        ),
                                    );
                                };

                                #ok;
                            },
                        );
                    },
                );

                /********************
                * getIntervalBetween
                *********************/
                await r.describe(
                    "getIntervalBetween",
                    func() : async () {
                        await r.it(
                            "should return the correct value",
                            func() : async Test.TestResult {
                                let rootIdentifier : Types.NodeIdentifier = [];
                                let tree = Tree.Tree(null);
                                let nodesToInsert = Mocks.helloWorld;
                                switch (tree.insertMany(nodesToInsert)) {
                                    case (#err(err)) {
                                        return #err(#failedTest(?("Failed to insert nodes. Received Error" # debug_show (err))));
                                    };
                                    case (#ok) {};
                                };

                                let variants : [([Types.NodeIndex], [Types.NodeIndex], [Types.NodeIndex])] = [
                                    ([0], [1], [0]),
                                    ([1], [1], [0]),
                                    ([1], [2], [0]),
                                    ([1], [3], [1]),
                                    ([0, 0], [1, 0], [0, 31]),
                                    ([0, 1], [0, 3], [0, 1]),
                                    ([0, 1, 0], [0, 3, 12], [0, 2, 11]),
                                    ([4, 3, 15], [4, 15, 31], [0, 12, 15]),
                                    ([5, 4, 3], [10, 2, 4], [4, 30, 0]),
                                    ([10, 5, 2, 0], [10, 5, 3, 0], [0, 0, 0, 127]),
                                    ([1, 21], [1, 22], [0, 0]),
                                    ([1, 21, 0], [1, 22, 0], [0, 0, 63]),
                                ];

                                for (variant in variants.vals()) {
                                    let start = variant.0;
                                    let end = variant.1;
                                    let expected = variant.2;
                                    let interval = Interval.between(start, end);
                                    assertThat<[Types.NodeIndex]>(
                                        interval.value,
                                        Matchers.equals(
                                            Testable.array<Types.NodeIndex>(
                                                Testable.nat16Testable,
                                                expected,
                                            )
                                        ),
                                    );
                                };

                                #ok;
                            },
                        );
                    },
                );

                // /********************
                // * getIdentifierBetween
                // *********************/
                // await r.describe(
                //     "getIdentifierBetween",
                //     func() : async () {
                //         await r.it(
                //             "should fail if node exists already",
                //             func() : async Test.TestResult {
                //                 let tree = Tree.Tree(null);
                //                 let nodesToInsert = Mocks.helloWorld;
                //                 switch (tree.insertMany(nodesToInsert)) {
                //                     case (#err(err)) {
                //                         return #err(#failedTest(?("Failed to insert nodes. Received Error" # debug_show (err))));
                //                     };
                //                     case (#ok) {};
                //                 };

                //                 let availableIdentifiersForHello = Mocks.getAvailableIdentifiersForHello();
                //                 // let availableIdentifiers = Tree.getIdentifierBetween(tree, [1, 20], [4]);
                //                 let availableIdentifiers = Tree.getIdentifierBetween(tree, [1, 20], [1, 21, 1]);

                //                 // assertThat(availableIdentifiers, Matchers.equals(Testable.array<Types.NodeIdentifier>(Testable.arrayTestable<Types.NodeIndex>(Testable.nat16Testable), availableIdentifiersForHello)));
                //                 // assertThat(Array.size(availableIdentifiers), Matchers.equals(Testable.int(Array.size(availableIdentifiersForHello))));
                //                 #ok;
                //             },
                //         );
                //     },
                // );

            },
        );
    };
};
