import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";

import Activity "../../../lib/activities/activity";
import ActivityBuilder "../../../lib/activities/activity_builder";
import BlocksTypes "../../../lib/blocks/types";

import State "../state";
import Types "../types/v2";

module ExtendActivity {
    type Input = Types.Services.ExtendActivityService.ExtendActivityServiceInput;
    type Output = Types.Services.ExtendActivityService.ExtendActivityServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        input : Input,
    ) : Output {
        let initialActivity = switch (
            State.findActivity(state, input.activityId)
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

        for (edit in activity.edits.vals()) {
            activityBuilder := activityBuilder.addEdit(edit);
        };

        ignore State.updateActivity(state, activity);

        return activity;
    };
};
