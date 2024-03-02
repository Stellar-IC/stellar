import Array "mo:base/Array";
import UUID "mo:uuid/UUID";

import EditItem "../../lib/activities/EditItem";
import BlocksModels "../../lib/blocks/models";
import LseqTree "../../utils/data/lseq/Tree";

import Types "./types";

module Activity {
    public func fromShareable(input : Types.ShareableActivity) : Types.Activity {
        return {
            blockExternalId = input.blockExternalId;
            var edits = Array.map(input.edits, EditItem.fromShareable);
            var endTime = input.endTime;
            startTime = input.startTime;
            uuid = input.uuid;
        };
    };

    public func toShareable(input : Types.Activity) : Types.ShareableActivity {
        return {
            blockExternalId = input.blockExternalId;
            edits = Array.map(input.edits, EditItem.toShareable);
            endTime = input.endTime;
            startTime = input.startTime;
            uuid = input.uuid;
        };
    };

    public func toText(input : Types.Activity) : Text {
        let editCount = Array.size(input.edits);
        let finalEdit : ?Types.EditItem = switch (editCount == 0) {
            case (true) { null };
            case (false) { ?input.edits[editCount - 1] };
        };
        let blockContent : Text = switch (finalEdit) {
            case (null) { "" };
            case (?edit) {
                let title = edit.blockValue.after.properties.title;
                switch (title) {
                    case (null) { "" };
                    case (?title) {
                        LseqTree.toText(title);
                    };
                };
            };
        };

        return (
            "Activity (" #
            UUID.toText(input.uuid) #
            ") on block (" #
            UUID.toText(input.blockExternalId) #
            ")" #
            "\n\tstartTime=" # debug_show (input.startTime) #
            "\n\tendTime=" # debug_show (input.endTime) #
            "\n\tedits=" # debug_show (Array.size(input.edits)) #
            "\n\tblockContent=" # blockContent
        );
    };
};
