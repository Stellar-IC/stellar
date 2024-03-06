import BlocksModels "../../lib/blocks/models";
import Types "./types";

module EditItem {
    public func fromShareable(input : Types.ShareableEditItem) : Types.EditItem {
        return {
            input with
            blockValue = {
                before = switch (input.blockValue.before) {
                    case (null) { null };
                    case (?before) {
                        ?BlocksModels.Block.fromShareable(before);
                    };
                };
                after = BlocksModels.Block.fromShareable(input.blockValue.after);
            };
        };
    };

    public func toShareable(input : Types.EditItem) : Types.ShareableEditItem {
        return {
            input with
            blockValue = {
                before = switch (input.blockValue.before) {
                    case (null) { null };
                    case (?before) {
                        ?BlocksModels.Block.toShareable(before);
                    };
                };
                after = BlocksModels.Block.toShareable(input.blockValue.after);
            };
        };
    };

};
