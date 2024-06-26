import Array "mo:base/Array";
import Debug "mo:base/Debug";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../../../lib/blocks/types";
import Tree "../../../../utils/data/lseq/Tree";
import LseqTypes "../../../../utils/data/lseq/types";

module {
    type BlockPropertyTitleUpdatedEventData = BlocksTypes.BlockPropertyTitleUpdatedEventData;
    type BlockPropertyCheckedUpdatedEventData = BlocksTypes.BlockPropertyCheckedUpdatedEventData;
    type BlockPropertyUpdatedEvent = BlocksTypes.CoreBlockEventData and {
        data : {
            #title : BlocksTypes.BlockPropertyTitleUpdatedEventData;
            #checked : BlocksTypes.BlockPropertyCheckedUpdatedEventData;
        };
    };
    type Block = BlocksTypes.Block;

    public func execute(event : BlockPropertyUpdatedEvent, block : Block) {
        switch (event.data) {
            case (#title(data)) { handleTitle(data, block) };
            case (#checked(data)) { handleChecked(data, block) };
        };
    };

    private func handleTitle(data : BlockPropertyTitleUpdatedEventData, block : Block) {
        let blockExternalId = data.blockExternalId;
        let title = block.properties.title;

        for (event in Array.vals(data.transaction)) {
            switch (event) {
                case (#insert(treeEvent)) {
                    switch (title) {
                        case (null) {};
                        case (?title) {
                            let result = title.insert({
                                identifier = treeEvent.position;
                                value = treeEvent.value;
                            });

                            switch (result) {
                                case (#err(err)) {
                                    Debug.print("Error updating title property for block: " # UUID.toText(blockExternalId) # "\n\tError: " # debug_show err);
                                };
                                case (#ok) {};
                            };
                        };
                    };
                };
                case (#delete(treeEvent)) {
                    switch (title) {
                        case (null) {};
                        case (?title) {
                            title.deleteNode(treeEvent.position);
                        };
                    };
                };
            };
        };
    };

    private func handleChecked(data : BlockPropertyCheckedUpdatedEventData, block : Block) : () {
        let blockExternalId = data.blockExternalId;
        block.properties.checked := ?data.checked;
    };
};
