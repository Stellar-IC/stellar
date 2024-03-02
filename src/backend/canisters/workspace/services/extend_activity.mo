import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";

import Activity "../../../lib/activities/Activity";
import ActivityBuilder "../../../lib/activities/ActivityBuilder";
import BlocksTypes "../../../lib/blocks/types";
import UUIDGenerator "../../../lib/shared/UUIDGenerator";

import State "../model/state";
import Types "../types";

module ExtendActivity {
    type Input = Types.Services.ExtendActivityService.ExtendActivityServiceInput;
    type Output = Types.Services.ExtendActivityService.ExtendActivityServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        input : Input,
    ) : Output {
        let initialActivity = switch (
            state.data.Activity.objects.get(UUID.toText(input.activityId))
        ) {
            case (null) { Debug.trap("Activity not found") };
            case (?initialActivity) { initialActivity };
        };

        var activityBuilder = ActivityBuilder.fromActivity(
            initialActivity
        );

        for (edit in input.edits.vals()) {
            activityBuilder := activityBuilder.addEdit(edit);
        };

        let activity = activityBuilder.build();

        state.data.Activity.objects.upsert(activity);

        return activity;
    };
};
