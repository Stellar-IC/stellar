import BlocksTypes "../../../../lib/blocks/types";

module {
    type BlockParentUpdatedEvent = BlocksTypes.BlockParentUpdatedEvent;
    type Block = BlocksTypes.Block;

    public func execute(event : BlockParentUpdatedEvent, block : Block) {
        block.parent := ?event.data.parentBlockExternalId;
    };
};
