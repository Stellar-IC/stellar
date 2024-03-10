import Block "../../lib/blocks/Block";
import Types "./types";

module EditItem {
    public func fromShareable(input : Types.ShareableEditItem) : Types.EditItem {
        return {
            input with
            blockValue = {
                before = switch (input.blockValue.before) {
                    case (null) { null };
                    case (?before) {
                        ?Block.fromShareable(before);
                    };
                };
                after = Block.fromShareable(input.blockValue.after);
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
                        ?Block.toShareable(before);
                    };
                };
                after = Block.toShareable(input.blockValue.after);
            };
        };
    };

};
