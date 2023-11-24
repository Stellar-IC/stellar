import BlocksTypes "../../../../lib/blocks/types";

module {
    type BlockParentUpdatedEvent = BlocksTypes.BlockParentUpdatedEvent;
    type Block_v2 = BlocksTypes.Block_v2;

    public func execute(event : BlockParentUpdatedEvent, block : Block_v2) {
        block.parent := ?event.data.parentBlockExternalId;
    };
};
