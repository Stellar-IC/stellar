import HashMap "mo:base/HashMap";
import Nat16 "mo:base/Nat16";
import Time "mo:base/Time";

module Types {
    public type NodeIndex = Nat16;
    public type NodeBase = Nat16;
    public type NodeDepth = Nat16;
    public type NodeValue = Text;
    public type NodeIdentifier = [NodeIndex];
    public type NodeBoundary = Nat16;

    public type Node = {
        base : NodeBase;
        identifier : NodeIdentifier;
        value : NodeValue;
        children : HashMap.HashMap<NodeIndex, Node>;
        var deletedAt : ?Time.Time;
    };

    public type ShareableNode = {
        base : NodeBase;
        identifier : NodeIdentifier;
        value : NodeValue;
        children : [(NodeIndex, ShareableNode)];
        deletedAt : ?Time.Time;
    };

    public type AllocationStrategy = {
        #boundaryPlus;
        #boundaryMinus;
    };

    public type ShareableTree = {
        allocationStrategies : [(NodeDepth, AllocationStrategy)];
        boundary : NodeBoundary;
        rootNode : ShareableNode;
    };

    public type TreeEvent = {
        #insert : {
            transactionType : { #insert };
            position : NodeIdentifier;
            value : NodeValue;
        };
        #delete : {
            transactionType : { #delete };
            position : NodeIdentifier;
        };
    };

    public type TreeEventTransaction = [TreeEvent];
};
