import Principal "mo:base/Principal";
import Matchers "mo:matchers/Matchers";
import { assertThat } "mo:matchers/Matchers";
import Testable "mo:matchers/Testable";

import Test "../../../../utils/test";

import TestRunner "../../../../utils/test/test_runner";
import State "../../model/state";

import CreateUser "../create_user";

module TestCreateUser {
    let mock_stable_data = {
        user_canister_id_to_identity = #leaf;
        user_identity_to_canister_id = #leaf;
    };

    public func run(r : TestRunner.TestRunner, caller : Principal) : async () {
        await r.describe(
            "createUser",
            func() : async () {
                await r.it(
                    "should fail when given user is anonymous ",
                    func() : async Test.TestResult {
                        let state = State.State(State.Data(mock_stable_data));
                        let userPrincipal = await CreateUser.execute(
                            state,
                            Principal.fromText("2vxsx-fae"),
                            caller,
                        );

                        switch (userPrincipal) {
                            case (#err(#anonymousUser)) {
                                return #ok;
                            };
                            case (#err(#canisterNotFoundForRegisteredUser)) {
                                return #err(#failedTest(?"Should not fail with canister not found for registered user"));
                            };
                            case (#err(#insufficientCycles)) {
                                return #err(#failedTest(?"Should not fail with insufficient cycles"));
                            };
                            case (#ok(principal)) {
                                return #err(#failedTest(?"Should not succeed"));
                            };
                        };
                    },
                );

                await r.it(
                    "should create user canister and store it in the user index canister",
                    func() : async Test.TestResult {
                        let state = State.State(State.Data(mock_stable_data));
                        let mockCanisterId = "okk5z-p6mlp-svktn-fn5oe-brauj-i3mno-3oiy6-gaeh6-i6gga-6p7v5-hae";
                        let userPrincipal = await CreateUser.execute(
                            state,
                            Principal.fromText(mockCanisterId),
                            caller,
                        );

                        switch (userPrincipal) {
                            case (#err(#anonymousUser)) {
                                return #err(#failedTest(?"Should not fail with anonymous user"));
                            };
                            case (#err(#canisterNotFoundForRegisteredUser)) {
                                return #err(#failedTest(?"Should not fail with canister not found for registered user"));
                            };
                            case (#err(#insufficientCycles)) {
                                return #err(#failedTest(?"Should not fail with insufficient cycles"));
                            };
                            case (#ok(#created(principal, user))) {
                                let user_id = state.data.getUserIdByOwner(principal);

                                switch (user_id) {
                                    case (?user_id_value) {
                                        assertThat(user_id_value, Matchers.equals<Principal>({ display = Principal.toText; equals = Principal.equal; item = Principal.fromText(mockCanisterId) }));
                                        return #ok;
                                    };
                                    case (null) {
                                        return #err(#failedTest(?"Unable to find user id in user index canister"));
                                    };
                                };
                            };
                            case (#ok(#existing(principal, user))) {
                                return #err(#failedTest(?"User already exists"));
                            };
                        };
                    },
                );
            },
        );
    };
};
