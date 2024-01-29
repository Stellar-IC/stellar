import UUID "mo:uuid/UUID";
import BlocksTypes "./types";

module BlocksUtils {
    public func getEventId(event : BlocksTypes.BlockEvent) : Text {
        switch (event) {
            case (#empty) {
                return "";
            };
            case (#blockCreated(event)) {
                return UUID.toText(event.uuid);
            };
            case (#blockUpdated(event)) {
                return switch (event) {
                    case (#updateBlockType(event)) {
                        UUID.toText(event.uuid);
                    };
                    case (#updateContent(event)) { UUID.toText(event.uuid) };
                    case (#updatePropertyTitle(event)) {
                        UUID.toText(event.uuid);
                    };
                    case (#updatePropertyChecked(event)) {
                        UUID.toText(event.uuid);
                    };
                    case (#updateParent(event)) { UUID.toText(event.uuid) };
                };
            };
        };
    };
};
