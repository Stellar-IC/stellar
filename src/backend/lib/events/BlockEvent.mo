import Array "mo:base/Array";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";

import LseqTypes "../../utils/data/lseq/types";
import TreeEvent "../../utils/data/lseq/TreeEvent";

import BlocksTypes "../blocks/Types";

module BlockEvent {
    public func getId(event : BlocksTypes.BlockEvent) : UUID.UUID {
        return event.uuid;
    };

    public func toText(event : BlocksTypes.BlockEvent) : Text {
        let blockExternalId = UUID.toText(
            switch (event.data) {
                case (#blockCreated(data)) { data.block.uuid };
                case (#blockUpdated(data)) {
                    switch (data) {
                        case (#updateBlockType(data)) {
                            data.blockExternalId;
                        };
                        case (#updateContent(data)) {
                            data.blockExternalId;
                        };
                        case (#updatePropertyChecked(data)) {
                            data.blockExternalId;
                        };
                        case (#updatePropertyTitle(data)) {
                            data.blockExternalId;
                        };
                        case (#updateParent(data)) {
                            data.blockExternalId;
                        };
                    };
                };
            }
        );

        let transaction : [Text] = switch (event.data) {
            case (#blockCreated(data)) { [] };
            case (#blockUpdated(data)) {
                switch (data) {
                    case (#updateBlockType(data)) { [] };
                    case (#updateContent(data)) {
                        Array.map(data.transaction, TreeEvent.toText);
                    };
                    case (#updatePropertyChecked(data)) { [] };
                    case (#updatePropertyTitle(data)) {
                        Array.map(data.transaction, TreeEvent.toText);
                    };
                    case (#updateParent(data)) { [] };
                };
            };
        };

        return (
            "Event (" # UUID.toText(event.uuid) # ")" #
            " on block (" # blockExternalId # ")" #
            "\n\ttransaction=" # debug_show (transaction) #
            "\n\ttimestamp=" # debug_show (event.timestamp)
        );
    };
};
