import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";

import ActivityBuilder "../../../lib/activities/ActivityBuilder";
import BlocksTypes "../../../lib/blocks/types";
import UUIDGenerator "../../../lib/shared/UUIDGenerator";

import State "../model/state";
import Types "../types";

module CreateActivity {
    type Input = Types.Services.CreateActivityService.CreateActivityServiceInput;
    type Output = Types.Services.CreateActivityService.CreateActivityServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        input : Input,
        deps : { uuidGenerator : UUIDGenerator.UUIDGenerator },
    ) : Output {
        var activityBuilder = ActivityBuilder.ActivityBuilder(
            {
                blockExternalId = input.blockExternalId;
                uuid = deps.uuidGenerator.next();
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
