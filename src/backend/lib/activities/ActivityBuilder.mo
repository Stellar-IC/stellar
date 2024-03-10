import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import Types "./types";

module {
    type DraftActivity = {
        uuid : UUID.UUID;
        blockExternalId : UUID.UUID;
        var edits : Buffer.Buffer<Types.EditItem>;
        var startTime : Time.Time;
        var endTime : Time.Time;
    };

    public class ActivityBuilder(
        initialValues : {
            blockExternalId : UUID.UUID;
            uuid : UUID.UUID;
        }
    ) = self {
        private let activity : DraftActivity = {
            uuid = initialValues.uuid;
            blockExternalId = initialValues.blockExternalId;
            var edits = Buffer.fromArray([]);
            var startTime = Time.now();
            var endTime = Time.now();
        };

        public func addEdit(edit : Types.EditItem) : ActivityBuilder {
            if (activity.edits.size() == 0) {
                activity.startTime := edit.startTime;
            };

            activity.endTime := edit.startTime;
            activity.edits.add(edit);

            return self;
        };

        public func build() : Types.Activity {
            return {
                activity with
                uuid = activity.uuid;
                blockExternalId = activity.blockExternalId;
                var edits = Buffer.toArray(activity.edits);
                startTime = activity.startTime;
                var endTime = activity.endTime;
            };
        };
    };

    public func fromActivity(inputActivity : Types.Activity) : ActivityBuilder {
        var activityBuilder = ActivityBuilder(
            {
                blockExternalId = inputActivity.blockExternalId;
                uuid = inputActivity.uuid;
            }
        );

        for (edit in inputActivity.edits.vals()) {
            activityBuilder := activityBuilder.addEdit(edit);
        };

        return activityBuilder;
    };
};
