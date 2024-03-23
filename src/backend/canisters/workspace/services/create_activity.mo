import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import Activity "../../../lib/activities/Activity";
import ActivityBuilder "../../../lib/activities/ActivityBuilder";
import BlocksTypes "../../../lib/blocks/types";
import Logger "../../../lib/Logger";

import State "../state";
import Types "../types/v2";

module CreateActivity {
    type Input = Types.Services.CreateActivityService.CreateActivityServiceInput;
    type Output = Types.Services.CreateActivityService.CreateActivityServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        input : Input,
    ) : Output {
        var activityBuilder = ActivityBuilder.ActivityBuilder(
            {
                blockExternalId = input.blockExternalId;
                id = input.id;
            }
        );

        for (edit in input.edits.vals()) {
            activityBuilder := activityBuilder.addEdit(edit);
        };

        let activity = activityBuilder.build();

        state.data.Activity.objects.upsert(activity);

        return activity;
    };
};
