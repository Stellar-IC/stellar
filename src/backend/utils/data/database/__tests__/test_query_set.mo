import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

import Test "../../../test";
import TestRunner "../../../test/test_runner";
import QuerySet "../../database/query_set";

module TestQuerySet {
    public func run(r : TestRunner.TestRunner, caller : Principal) : async () {
        await r.describe(
            "QuerySet.QuerySet",
            func() : async () {
                await r.describe(
                    "get",
                    func() : async () {},
                );
                await r.describe(
                    "filter",
                    func() : async () {},
                );
                await r.describe(
                    "insert",
                    func() : async () {},
                );
                await r.describe(
                    "update",
                    func() : async () {},
                );
                await r.describe(
                    "delete",
                    func() : async () {},
                );
            },
        );
    };
};
