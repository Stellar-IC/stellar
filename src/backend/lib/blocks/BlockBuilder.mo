import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time "mo:base/Time";
import UUID "mo:uuid/UUID";

import Tree "../../utils/data/lseq/Tree";

import Types "./types";

module {
    public class BlockBuilder(
        initialValues : {
            uuid : UUID.UUID;
        }
    ) = self {
        private let block : Types.Block = {
            uuid = initialValues.uuid;
            var blockType = #paragraph;
            content = Tree.Tree(null);
            var parent = null;
            properties = {
                title = ?Tree.Tree(null);
                var checked = ?false;
            };
        };

        public func addContentBlock(contentBlock : Types.Block) : BlockBuilder {
            ignore Tree.insertCharacterAtStart(block.content, UUID.toText(contentBlock.uuid));
            return self;
        };

        public func setBlockType(blockType : Types.BlockType) : BlockBuilder {
            block.blockType := blockType;
            return self;
        };

        public func build() : Types.Block {
            return block;
        };
    };
};
