import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Matchers "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Suite "mo:matchers/Suite";

import UUID "mo:uuid/UUID";

import Activity "../../../../lib/activities/Activity";
import ActivitiesTypes "../../../../lib/activities/Types";
import BlockBuilder "../../../../lib/blocks/BlockBuilder";
import TestHelpers "../../../../tests/helpers";
import UUIDUtils "../../../../utils/uuid";

import State "../../model/state";

import CreateActivity "../create_activity";
import ExtendActivity "../extend_activity";

let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
    case (#err(msg)) { Debug.trap(msg) };
    case (#ok(uuid)) { uuid };
};

let suite = Suite.suite(
    "ExtendActivity",
    [
        Suite.suite(
            "execute",
            [
                Suite.testLazy<ActivitiesTypes.Activity>(
                    "Should extend an activity",
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

                        assert (activity.startTime == Time.now());
                        assert (Array.size(activity.edits) == 0);

                        var extendedActivity = ExtendActivity.execute(
                            state,
                            {
                                activityId = 0;
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

                        assert (extendedActivity.startTime == 1_000_000_000);
                        assert (Array.size(extendedActivity.edits) == 1);

                        extendedActivity := ExtendActivity.execute(
                            state,
                            {
                                activityId = 0;
                                edits = [{
                                    user = Principal.fromText("2vxsx-fae");
                                    startTime = 2_000_000_000;
                                    blockValue = {
                                        before = null;
                                        after = block;
                                    };
                                }];
                            },
                        );

                        assert (Array.size(extendedActivity.edits) == 2);
                        assert (extendedActivity.startTime == 1_000_000_000);
                        assert (extendedActivity.endTime == 2_000_000_000);

                        return extendedActivity;
                    },
                    Matchers.equals(
                        TestHelpers.activity({
                            id = 0;
                            blockExternalId = blockUuid;
                            var endTime = 2_000_000_000;
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
