import Principal "mo:base/Principal";
import Matchers "mo:matchers/Matchers";
import { assertThat } "mo:matchers/Matchers";
import Testable "mo:matchers/Testable";

import Test "../../../../utils/test";

import TestRunner "../../../../utils/test/test_runner";
import State "../../model/state";

import CreatePage "../create_page";

module TestCreatePage {
    let mock_stable_data = {
        username_to_user_id = #leaf;
        principal_to_user_id = #leaf;
        user_id_to_principal = #leaf;
    };

    public func run(r : TestRunner.TestRunner, caller : Principal) : async () {
        await r.describe(
            "execute",
            func() : async () {

            },
        );
    };
};
