import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Time "mo:base/Time";
import Bool "mo:base/Bool";
import Debug "mo:base/Debug";
import Order "mo:base/Order";

import NodeIdentifier "./NodeIdentifier";
import Types "./types";
import Interval "Interval";

module Node {
    type AllocationStrategy = Types.AllocationStrategy;
    type NodeBase = Types.NodeBase;
    type NodeBoundary = Types.NodeBoundary;
    type NodeValue = Types.NodeValue;
    type NodeIndex = Types.NodeIndex;
    type NodeDepth = Types.NodeDepth;
    type ShareableNode = Types.ShareableNode;

    let START_NODE_ID : [NodeIndex] = [0];
    let END_NODE_ID : [NodeIndex] = [15];

    public class Node(_identifier : NodeIdentifier.Identifier, _value : Text) {
        public let identifier : NodeIdentifier.Identifier = _identifier;
        public let value : NodeValue = _value;
        public let base : NodeBase = 2 ** (4 + Nat16.fromNat(identifier.length()));
        private let baseNat : Nat = Nat16.toNat(base);
        public let children : HashMap.HashMap<NodeIndex, Node> = HashMap.HashMap<NodeIndex, Node>(baseNat, Nat16.equal, func x = Nat32.fromNat(Nat16.toNat(x)));
        public var deletedAt : ?Time.Time = null;

        public func delete() {
            deletedAt := ?Time.now();
        };

    };

    public func fromShareableNode(input : ShareableNode) : Node {
        var updatedChildren = HashMap.HashMap<Nat16, Node>(Nat16.toNat(input.base), Nat16.equal, func x = Nat32.fromNat(Nat16.toNat(x)));
        let node = Node(NodeIdentifier.Identifier(input.identifier), input.value);

        for (child in input.children.vals()) {
            let index = child.0;
            let childNode = child.1;
            node.children.put(index, fromShareableNode(childNode));
        };

        node.deletedAt := input.deletedAt;

        return node;
    };

    public func toShareableNode(input : Node) : ShareableNode {
        var shareable : {
            var children : [(NodeIndex, ShareableNode)];
        } = {
            var children = [];
        };

        for (child in input.children.entries()) {
            let index = child.0;
            let node = child.1;
            let currentChildren = Buffer.fromArray<(NodeIndex, ShareableNode)>(shareable.children);
            currentChildren.add((index, toShareableNode(node)));
            shareable.children := Buffer.toArray(currentChildren);
        };

        return {
            input and shareable with children = shareable.children;
            deletedAt = input.deletedAt;
            identifier = input.identifier.value;
        };
    };

    public func isRootNode(node : Node) : Bool {
        return node.identifier.length() == 0;
    };

    public func isEdgeNode(node : Node) : Bool {
        return (
            node.identifier.length() == 1 and (
                node.identifier.value[0] == START_NODE_ID[0] or node.identifier.value[0] == END_NODE_ID[0]
            )
        );
    };

    public func hasChildren(
        node : Node
    ) : Bool {
        let shouldSkipDeleted = true;

        if (isEdgeNode(node)) return false;

        label doLoop for (childNode in node.children.vals()) {
            if (isEdgeNode(childNode)) continue doLoop;
            if (shouldSkipDeleted and childNode.deletedAt != null) continue doLoop;
            return true;
        };

        return false;
    };

    public func compare(nodeA : Node, nodeB : Node) : Order.Order {
        return NodeIdentifier.compare(nodeA.identifier, nodeB.identifier);
    };

    public func equal(node1 : Node, node2 : Node) : Bool {
        return compare(node1, node2) == #equal;
    };

    public func nullableEqual(node1 : ?Node, node2 : ?Node) : Bool {
        switch (node1, node2) {
            case (null, null) {
                return true;
            };
            case (null, _) {
                return false;
            };
            case (_, null) {
                return false;
            };
            case (?node1, ?node2) {
                return compare(node1, node2) == #equal;
            };
        };
    };

    /**
     * Get the base for a given node depth.
     *
     * @param depth The depth of the node.
     * @return The base for the given node depth.
     */
    public func base(depth : NodeDepth) : NodeBase {
        return 2 ** (4 + depth);
    };

    public func getShallowInsertDepth(
        nodeAIdentifier : NodeIdentifier.Identifier,
        nodeBIdentifier : NodeIdentifier.Identifier,
    ) : NodeDepth {
        let maxLoopCount = 20;
        var i = 0;
        var depth : NodeDepth = 0;
        var interval : Interval.Interval = Interval.Interval([]);
        var nodeAPrefix : [NodeIndex] = [];
        var nodeBPrefix : [NodeIndex] = [];

        while (_isValidInterval(interval) == false and i < maxLoopCount) {
            depth := depth + 1;
            nodeAPrefix := prefix(nodeAIdentifier, depth);
            nodeBPrefix := prefix(nodeBIdentifier, depth);
            interval := Interval.between(nodeAPrefix, nodeBPrefix);
            i += 1;

            if (i == maxLoopCount) Debug.trap("Unable to determine depth for node identifier");
        };

        return depth;
    };

    /**
     * Calculate the prefix of a node identifier at a given depth
     *
     * @param nodeId The node identifier.
     * @param depth The depth to calculate the prefix at.
     * @return The prefix of the node identifier at the given depth.
     */
    public func prefix(
        identifier : NodeIdentifier.Identifier,
        depth : NodeDepth,
    ) : [NodeIndex] {
        let nodeIdBuffer = Buffer.fromArray<NodeIndex>(identifier.value);
        var idCopy = Buffer.fromArray<NodeIndex>([]);

        for (i in Iter.range(0, Nat16.toNat(depth) - 1)) {
            if (i < nodeIdBuffer.size()) {
                idCopy.add(identifier.value[i]);
            } else {
                idCopy.add(0);
            };
        };

        return Buffer.toArray(idCopy);
    };

    private func _isValidInterval(interval : Interval.Interval) : Bool {
        let intervalValue = interval.value;

        if (Array.size(intervalValue) == 0) {
            return false;
        };

        if (interval.isAllZeros()) {
            return false;
        };

        label doLoop for (num in Array.vals(intervalValue)) {
            if (num < 1) {
                continue doLoop;
            };

            return true;
        };

        return false;
    };
};
