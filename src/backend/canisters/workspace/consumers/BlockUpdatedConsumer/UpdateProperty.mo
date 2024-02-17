import UUID "mo:uuid/UUID";
import Array "mo:base/Array";

import BlocksTypes "../../../../lib/blocks/types";

import Tree "../../../../utils/data/lseq/Tree";
import LseqTypes "../../../../utils/data/lseq/types";

module {
    type BlockProperyCheckedUpdatedEvent = BlocksTypes.BlockPropertyCheckedUpdatedEvent;
    type BlockProperyTitleUpdatedEvent = BlocksTypes.BlockPropertyTitleUpdatedEvent;
    type BlockProperyUpdatedEvent = {
        #title : BlocksTypes.BlockPropertyTitleUpdatedEvent;
        #checked : BlocksTypes.BlockPropertyCheckedUpdatedEvent;
    };
    type Block = BlocksTypes.Block;

    public func execute(event : BlockProperyUpdatedEvent, block : Block) {
        switch (event) {
            case (#title(event)) {
                return handleTitle(event, block);
            };
            case (#checked(event)) {
                return handleChecked(event, block);
            };
        };
    };

    private func handleTitle(event : BlockProperyTitleUpdatedEvent, block : Block) {
        let blockExternalId = event.data.blockExternalId;
        let title = block.properties.title;

        for (event in Array.vals(event.data.transaction)) {
            switch (event) {
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

    };

    private func handleChecked(event : BlockProperyCheckedUpdatedEvent, block : Block) : () {
        let blockExternalId = event.data.blockExternalId;
        block.properties.checked := ?event.data.checked;
    };
};
