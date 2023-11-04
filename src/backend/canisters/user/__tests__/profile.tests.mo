import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Matchers "mo:matchers/Matchers";
import { assertThat; equals } "mo:matchers/Matchers";
import Testable "mo:matchers/Testable";

import Test "../../../utils/test";
import TestRunner "../../../utils/test/test_runner";

// import State "../model/state";

import User "../main";

actor TestProfile {
    private var _user : ?User.User = null;

    private func getCanister() : async User.User {
        switch (_user) {
            case (null) {
                let user = await User.User({
                    owner = Principal.fromActor(TestProfile);
                    capacity = 100_000_000_000_000;
                });
                _user := ?user;
                return user;
            };
            case (?user) {
                return user;
            };
        };
    };

    public func run() : async () {
        let r = TestRunner.TestRunner();
        let user = await getCanister();

        await r.describe(
            "profile",
            func() : async () {
                // await r.it(
                //     "should trap for an anonymous user",
                //     func() : async Test.TestResult {},
                // );

                // await r.it(
                //     "should trap for an unauthorized user",
                //     func() : async Test.TestResult {},
                // );

                await r.it(
                    "should return the user's profile",
                    func() : async Test.TestResult {
                        let result = await user.profile();
                        assertThat(result.username, equals(Testable.text("")));
                        // TODO: Add assertions for timestamp fields
                        #ok;
                    },
                );
            },
        );
    };
};
