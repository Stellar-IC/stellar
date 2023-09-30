import Types "./types";

module Base {
    type NodeBase = Types.NodeBase;
    type NodeDepth = Types.NodeDepth;

    public func at(depth : NodeDepth) : NodeBase {
        return 2 ** (4 + depth);
    };
};
