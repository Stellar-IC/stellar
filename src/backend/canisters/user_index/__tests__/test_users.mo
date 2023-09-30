import Principal "mo:base/Principal";

import Test "../../../utils/test";
import TestRunner "../../../utils/test/test_runner";

// import State "../model/state";

// import UserIndex "../main";

module TestUsers {
    public func run(r : TestRunner.TestRunner, caller : Principal) : async () {
        await r.describe(
            "users",
            func() : async () {
                await r.it(
                    "should fail when caller is anonymous ",
                    func() : async Test.TestResult {
                        // let mock_stable_data = {
                        //     username_to_user_id = #leaf;
                        //     principal_to_user_id = #leaf;
                        //     user_id_to_principal = #leaf;
                        // };
                        // let state = State.State(State.Data(mock_stable_data));
                        // await UserIndex().users(
                        //     state,
                        //     Principal.fromText("2vxsx-fae"),
                        //     caller,
                        // );
                        #ok;
                    },
                );
            },
        );
    };
};
