import UUID "mo:uuid/UUID";

import Tree "../../../../utils/data/lseq/Tree";
import LseqTypes "../../../../utils/data/lseq/types";
import BlocksTypes "../../../../lib/blocks/types";

module {
    type BlockProperyCheckedUpdatedEvent = BlocksTypes.BlockProperyCheckedUpdatedEvent;
    type BlockProperyTitleUpdatedEvent = BlocksTypes.BlockProperyTitleUpdatedEvent;
    type BlockProperyUpdatedEvent = {
        #title : BlocksTypes.BlockProperyTitleUpdatedEvent;
        #checked : BlocksTypes.BlockProperyCheckedUpdatedEvent;
    };

    public func execute(event : BlockProperyUpdatedEvent, block : BlocksTypes.Block) {
        switch (event) {
            case (#title(event)) {
                return handleTitle(event, block);
            };
            case (#checked(event)) {
                return handleChecked(event, block);
            };
        };
    };

    private func handleTitle(event : BlockProperyTitleUpdatedEvent, block : BlocksTypes.Block) {
        let blockExternalId = event.data.blockExternalId;
        let title = block.properties.title;

        switch (event.data.event) {
            case (#insert(treeEvent)) {
                switch (title) {
                    case (null) {};
                    case (?title) {
                        ignore title.insert({
                            identifier = treeEvent.position;
                            value = treeEvent.value;
                        });
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

    private func handleChecked(event : BlockProperyCheckedUpdatedEvent, block : BlocksTypes.Block) : () {
        let blockExternalId = event.data.blockExternalId;
        block.properties.checked := ?event.data.checked;
    };
};
