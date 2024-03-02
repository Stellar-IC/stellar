import Types "./types";
import Tree "../../utils/data/lseq/Tree";

module {
    public func clone(block : Types.Block) : Types.Block {
        return {
            id = block.id;
            uuid = block.uuid;
            var blockType = block.blockType;
            content = Tree.clone(block.content);
            var parent = block.parent;
            properties = {
                title = switch (block.properties.title) {
                    case (null) { null };
                    case (?title) { ?Tree.clone(title) };
                };
                var checked = block.properties.checked;
            };
        };
    };
};
