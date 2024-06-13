import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Matchers "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Suite "mo:matchers/Suite";

import UUID "mo:uuid/UUID";

import Activity "../../../../lib/activities/activity";
import ActivitiesTypes "../../../../lib/activities/types";
import BlockBuilder "../../../../lib/blocks/block_builder";
import TestHelpers "../../../../tests/helpers";
import UUIDUtils "../../../../utils/uuid";

import State "../../state";

import CreateActivity "../create_activity";

let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
    case (#err(msg)) { Debug.trap(msg) };
    case (#ok(uuid)) { uuid };
};

let suite = Suite.suite(
    "CreateActivity",
    [
        Suite.suite(
            "execute",
            [
                Suite.testLazy<ActivitiesTypes.Activity>(
                    "Should create an activity",
                    func() {
                        let now = Time.now();
                        let state = State.State(State.Data());
                        let block = BlockBuilder.BlockBuilder({
                            uuid = blockUuid;
                        }).build();
                        let activity = CreateActivity.execute(
                            state,
                            {
                                id = 0;
                                blockExternalId = block.uuid;
                                edits = [];
                            },
                        );
                        let activityFromState = switch (state.data.Activity.objects.get(0)) {
                            case (null) {
                                Debug.trap("Activity not found in state");
                            };
                            case (?activityFromState) {
                                assert (Activity.compare(activity, activityFromState));
                                activityFromState;
                            };
                        };

                        return activity;
                    },
                    Matchers.equals(
                        TestHelpers.activity({
                            id = 0;
                            blockExternalId = blockUuid;
                            var endTime = Time.now();
                            startTime = Time.now();
                            var edits = [];
                        })
                    ),
                ),
                Suite.testLazy<ActivitiesTypes.Activity>(
                    "Should create an activity with edits",
                    func() {
                        let state = State.State(State.Data());
                        let block = BlockBuilder.BlockBuilder({
                            uuid = blockUuid;
                        }).build();
                        let activity = CreateActivity.execute(
                            state,
                            {
                                id = 0;
                                blockExternalId = block.uuid;
                                edits = [{
                                    user = Principal.fromText("2vxsx-fae");
                                    startTime = 1_000_000_000;
                                    blockValue = {
                                        before = null;
                                        after = block;
                                    };
                                }];
                            },
                        );
                        let activityFromState = switch (state.data.Activity.objects.get(0)) {
                            case (null) {
                                Debug.trap("Activity not found in state");
                            };
                            case (?activityFromState) {
                                assert (Activity.compare(activity, activityFromState));
                                activityFromState;
                            };
                        };

                        return activity;
                    },
                    Matchers.equals(
                        TestHelpers.activity({
                            id = 0;
                            blockExternalId = blockUuid;
                            var endTime = 1_000_000_000;
                            startTime = 1_000_000_000;
                            var edits = [];
                        })
                    ),
                ),
            ],
        ),
    ],
);

Suite.run(suite);
