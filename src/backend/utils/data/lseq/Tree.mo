import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Int16 "mo:base/Int16";
import Int64 "mo:base/Int64";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Order "mo:base/Order";
import Random "mo:base/Random";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Int8 "mo:base/Int8";

import Interval "./Interval";
import Node "./Node";
import NodeIdentifier "./NodeIdentifier";
import Types "./types";

module Tree {
    type AllocationStrategy = Types.AllocationStrategy;
    type NodeBase = Types.NodeBase;
    type NodeBoundary = Types.NodeBoundary;
    type NodeIdentifier = Types.NodeIdentifier;
    type NodeValue = Types.NodeValue;
    type NodeIndex = Types.NodeIndex;
    type NodeDepth = Types.NodeDepth;
    type ShareableNode = Types.ShareableNode;
    type ShareableTree = Types.ShareableTree;

    let ROOT_NODE_BASE : NodeBase = 16;
    let DEFAULT_BOUNDARY : NodeBoundary = 10;
    let START_NODE_IDENTIFIER : [NodeIndex] = [0];
    let END_NODE_IDENTIFIER : [NodeIndex] = [15];

    func shouldSkipNode(node : Node.Node, shouldSkipDeleted : Bool) : Bool {
        let identifier = node.identifier;

        if (shouldSkipDeleted == true and node.deletedAt != null) {
            return true;
        };

        if (Array.equal<NodeIndex>(identifier.value, START_NODE_IDENTIFIER, Nat16.equal)) {
            return true;
        };

        if (Array.equal<NodeIndex>(identifier.value, END_NODE_IDENTIFIER, Nat16.equal)) {
            return true;
        };

        return false;
    };

    public class Tree(options : ?{ rootNode : ?Node.Node; boundary : ?NodeBoundary; allocationStrategies : ?[(NodeDepth, AllocationStrategy)] }) {
        let rootNodeBase : NodeBase = switch (options) {
            case (null) { ROOT_NODE_BASE };
            case (?options) {
                switch (options.rootNode) {
                    case (null) {
                        ROOT_NODE_BASE;
                    };
                    case (?rootNode) { rootNode.base };
                };
            };
        };

        let rootNodeBaseNat : Nat = Nat16.toNat(rootNodeBase);

        public let boundary : NodeBoundary = switch (options) {
            case (null) { DEFAULT_BOUNDARY };
            case (?options) {
                switch (options.boundary) {
                    case (null) { DEFAULT_BOUNDARY };
                    case (?boundary) { boundary };
                };
            };
        };

        let startNode = Node.Node(NodeIdentifier.Identifier(START_NODE_IDENTIFIER), "");
        let endNode = Node.Node(NodeIdentifier.Identifier(END_NODE_IDENTIFIER), "");

        public let rootNode : Node.Node = switch (options) {
            case (null) { Node.Node(NodeIdentifier.Identifier([]), "") };
            case (?options) {
                switch (options.rootNode) {
                    case (null) { Node.Node(NodeIdentifier.Identifier([]), "") };
                    case (?rootNode) { rootNode };
                };
            };
        };

        rootNode.children.put(START_NODE_IDENTIFIER[0], startNode);
        rootNode.children.put(END_NODE_IDENTIFIER[0], endNode);

        public let allocationStrategies = switch (options) {
            case (null) {
                HashMap.HashMap<NodeDepth, AllocationStrategy>(rootNodeBaseNat, Nat16.equal, func x = Nat32.fromNat(Nat16.toNat(x)));
            };
            case (?options) {
                switch (options.allocationStrategies) {
                    case (null) {
                        HashMap.HashMap<NodeDepth, AllocationStrategy>(rootNodeBaseNat, Nat16.equal, func x = Nat32.fromNat(Nat16.toNat(x)));
                    };
                    case (?allocationStrategies) {
                        let map = HashMap.HashMap<NodeDepth, AllocationStrategy>(rootNodeBaseNat, Nat16.equal, func x = Nat32.fromNat(Nat16.toNat(x)));
                        for (item in Array.vals<(NodeDepth, AllocationStrategy)>(allocationStrategies)) {
                            let depth = item.0;
                            let strategy = item.1;
                            map.put(depth, strategy);
                        };
                        map;
                    };
                };
            };
        };

        public func deleteNode(identifier : NodeIdentifier) {
            let node = get(identifier);

            switch (node) {
                case (null) { return };
                case (?node) { node.delete() };
            };
        };

        /**
         * Insert a node into the tree.
         *
         * This func will insert a node into the tree, given a node identifier.
         *
         * @param rootNode The root node of the tree.
         * @param node The node to insert.
         * @return The result of the insert operation.
         */
        public func insert({ identifier : NodeIdentifier; value : NodeValue }) : Result.Result<(), { #identifierAlreadyInUse; #invalidIdentifier; #outOfOrder }> {
            let identifierLength : Nat = Array.size(identifier);

            if (identifierLength == 0) {
                return #err(#invalidIdentifier);
            };

            var currentNode = rootNode;

            for (i in Iter.range(0, identifierLength - 1)) {
                let identifierPart = Nat16.toNat(identifier[i]);
                let childNode = currentNode.children.get(Nat16.fromNat(identifierPart));
                let currentNodeBase = currentNode.base;
                let currentNodeBaseMinusOne : Nat = Nat16.toNat(currentNodeBase - 1);

                if (identifierPart > currentNodeBaseMinusOne) {
                    return #err(#invalidIdentifier);
                };

                if (identifierLength < 1) {
                    return #err(#invalidIdentifier);
                };

                if (i == (+identifierLength - 1)) {
                    switch (childNode) {
                        case (null) {
                            let newNode = Node.Node(NodeIdentifier.Identifier(identifier), value);
                            currentNode.children.put(Nat16.fromNat(identifierPart), newNode);
                            return #ok;
                        };
                        case (?childNode) {
                            return #err(#identifierAlreadyInUse);
                        };
                    };
                    return #ok;
                };

                switch (childNode) {
                    case (null) {
                        return #err(#outOfOrder);
                    };
                    case (?childNode) {
                        currentNode := childNode;
                    };
                };
            };

            return #ok;
        };

        public func insertMany(nodes : [{ identifier : NodeIdentifier; value : NodeValue }]) : Result.Result<(), { #identifierAlreadyInUse; #invalidIdentifier; #outOfOrder }> {
            for (node in Array.vals(nodes)) {
                let { identifier; value } = node;
                let result = insert({ identifier; value });
                switch (result) {
                    case (#ok) {};
                    case (#err(err)) {
                        return #err(err);
                    };
                };
            };

            return #ok;
        };

        public func delete(identifier : NodeIdentifier.Identifier) {
            let node = get(identifier.value);
            switch (node) {
                case (null) { return };
                case (?node) {
                    node.delete();
                };
            };
        };

        public func allocationStrategy(depth : NodeDepth) : AllocationStrategy {
            var allocationStrategy = switch (allocationStrategies.get(depth)) {
                case (null) {
                    var strategy : AllocationStrategy = #boundaryPlus;
                    let seed : Blob = "Hello world I am a seed for the random number generator";
                    var randomValue : Float = Float.fromInt(Int8.toInt(Int8.fromNat8(Random.byteFrom(seed)))) / 255;

                    // choose random allocation strategy
                    if (randomValue < 0.5) {
                        strategy := #boundaryPlus;
                    } else {
                        strategy := #boundaryMinus;
                    };

                    strategy;
                };
                case (?allocationStrategy) { allocationStrategy };
            };

            allocationStrategies.put(depth, allocationStrategy);

            return allocationStrategy;
        };

        /**
         * Get a node from the tree.
         *
         * This func will get a node from the tree, given a node identifier.
         *
         * @param rootNode The root node of the tree.
         * @param identifier The identifier of the node to get.
         * @return The node, or null if the node does not exist.
         */
        public func get(identifier : NodeIdentifier) : ?Node.Node {
            func doRecursiveFind(root : Node.Node, identifier : NodeIdentifier) : ?Node.Node {
                let identifierLength = Array.size(identifier);

                if (identifierLength == 0) {
                    return ?root;
                };

                let base = Int16.toInt(Int16.fromNat16(root.base));
                label iterateChildren for (i in Iter.range(0, base - 1)) {
                    let childNode = root.children.get(Nat16.fromNat(i));

                    switch (childNode) {
                        case (null) {
                            continue iterateChildren;
                        };
                        case (?childNode) {
                            let identifierLength = Array.size(identifier);
                            let newIdentifier = Iter.toArray(Array.slice(identifier, 1, identifierLength));
                            if (i == Nat16.toNat(identifier[0])) {
                                return doRecursiveFind(childNode, newIdentifier);
                            } else {
                                continue iterateChildren;
                            };
                        };
                    };
                };

                return null;
            };

            return doRecursiveFind(rootNode, identifier);
        };

        public func size() : Nat {
            let shouldSkipDeleted = true;

            func calculateSize(root : Node.Node) : Nat {
                if (root.children.size() == 0) return 0;

                var final = 0;
                let childCount = root.base;

                label doLoop for (i in Iter.range(0, Int16.toInt(Int16.fromNat16(childCount)))) {
                    let childNode = root.children.get(Nat16.fromNat(i));
                    switch (childNode) {
                        case (null) { continue doLoop };
                        case (?childNode) {
                            final += calculateSize(childNode);
                            if (shouldSkipNode(childNode, shouldSkipDeleted) == false) {
                                final += 1;
                            };
                        };
                    };
                };

                return final;
            };

            return calculateSize(rootNode);
        };
    };

    public func base(depth : NodeDepth) : NodeBase {
        return 2 ** (4 + depth);
    };

    func getRandomNumberBetween(min : Nat, max : Nat) : Nat {
        let seed : Blob = "Hello world I am a seed for the random number generator";
        let randomValue = Random.byteFrom(seed);
        let range = Iter.range(min, max);
        let rangeSize = Iter.size(range);

        let maxRandomNumber = 255;

        // Scale index to be between 0 and the number of available node identifiers
        if (maxRandomNumber < rangeSize) {
            // scale up
            let scaleRatio = maxRandomNumber / rangeSize;
            let scaledRandomValue = Nat8.toNat(randomValue) / scaleRatio;

            return scaledRandomValue;
        };

        // scale down
        let scaleRatio : Float = Float.fromInt64(
            Int64.fromNat64(
                Nat64.fromNat(
                    rangeSize
                )
            )
        ) / Float.fromInt64(
            Int64.fromNat64(
                Nat64.fromNat(
                    maxRandomNumber
                )
            )
        );
        let scaledRandomValue = Float.fromInt64(
            Int64.fromNat64(
                Nat64.fromNat(
                    Nat8.toNat(randomValue)
                )
            )
        ) * scaleRatio;

        return Int.abs(
            Float.toInt(
                Float.ceil(
                    scaledRandomValue
                )
            )
        );
    };

    public func fromShareableTree(input : ShareableTree) : Tree {
        let rootNode = Node.fromShareableNode(input.rootNode);

        return Tree(
            ?{
                rootNode = ?rootNode;
                allocationStrategies = ?[];
                boundary = null;
            }
        );
    };

    public func toShareableTree(input : Tree) : ShareableTree {
        let rootNode = Node.toShareableNode(input.rootNode);

        return {
            rootNode = rootNode;
            allocationStrategies = [];
            boundary = input.boundary;
        };
    };

    func checkNodeAvailable(tree : Tree, identifier : NodeIdentifier.Identifier) : Bool {
        return switch (tree.get(identifier.value)) {
            case (null) { true };
            case (?node) { false };
        };
    };

    func getAvailableIdentifierBetween(
        tree : Tree,
        identifierA : NodeIdentifier.Identifier,
        identifierB : NodeIdentifier.Identifier,
    ) : NodeIdentifier.Identifier {
        var newIdentifier = getIdentifierBetween(tree, identifierA, identifierB);
        let maxLoopCount = 20;
        var loopCounter = 0;

        while (checkNodeAvailable(tree, newIdentifier) == false) {
            if (loopCounter == maxLoopCount) {
                Debug.trap("Unable to find available node identifier");
            };

            newIdentifier := getIdentifierBetween(tree, newIdentifier, identifierB);
            loopCounter += 1;
        };

        return newIdentifier;
    };

    public func buildNodesForFrontInsert(
        tree : Tree,
        character : Text,
    ) : {
        node : Node.Node;
        nodeToDelete : ?Node.Node;
        replacementNode : ?Node.Node;
    } {
        let rootNodeHasChildren = Node.hasChildren(tree.rootNode);

        if (rootNodeHasChildren == false) {
            // Root node has no children, insert the character as the first child
            let newNode = Node.Node(
                getAvailableIdentifierBetween(tree, NodeIdentifier.Identifier(START_NODE_IDENTIFIER), NodeIdentifier.Identifier(END_NODE_IDENTIFIER)),
                character,
            );

            return {
                node = newNode;
                nodeToDelete = null;
                replacementNode = null;
            };
        };

        let firstNode = getNodeAtPosition(tree, 0);
        let firstNodeIdenfier = firstNode.identifier;
        let firstNodeIdenfierLength = firstNodeIdenfier.length();
        let isFirstNodeEarliestPossibleChildNode = switch (firstNodeIdenfierLength == 1) {
            case (true) {
                firstNodeIdenfier.value[firstNodeIdenfierLength - 1] == 1;
            };
            case (false) {
                firstNodeIdenfier.value[firstNodeIdenfierLength - 1] == 0;
            };
        };

        if (isFirstNodeEarliestPossibleChildNode) {
            // Delete the first node in the tree and insert the character after it
            let deletedCharacter = firstNode.value;
            let followingNode = findNextNode(tree, firstNode.identifier);
            let followingNodeIdentifier = switch (followingNode) {
                case (null) { NodeIdentifier.Identifier(END_NODE_IDENTIFIER) };
                case (?followingNode) { followingNode.identifier };
            };

            let newNode = Node.Node(
                getAvailableIdentifierBetween(
                    tree,
                    firstNode.identifier,
                    followingNodeIdentifier,
                ),
                character,
            );
            let replacementNode = Node.Node(
                getAvailableIdentifierBetween(
                    tree,
                    newNode.identifier,
                    followingNodeIdentifier,
                ),
                deletedCharacter,
            );

            return {
                node = newNode;
                nodeToDelete = ?firstNode;
                replacementNode = ?replacementNode;
            };
        };

        // create a node before the first node in the tree
        let identifierForNewNode = getAvailableIdentifierBetween(
            tree,
            NodeIdentifier.Identifier(START_NODE_IDENTIFIER),
            firstNode.identifier,
        );
        let newNode = Node.Node(identifierForNewNode, character);
        let newNodeIdentifierLength = newNode.identifier.length();
        let newNodeIdentifierLengthMinusOne : Nat = newNodeIdentifierLength - 1;

        // check if this will be out of order insert
        if (
            newNodeIdentifierLength > 1
        ) {
            let parentNode = tree.get(
                Array.subArray(
                    identifierForNewNode.value,
                    0,
                    newNodeIdentifierLengthMinusOne,
                )
            );

            switch (parentNode) {
                case (null) {
                    // out of order insert, create parent node
                    return {
                        node = Node.Node(
                            NodeIdentifier.Identifier(
                                Array.subArray(
                                    identifierForNewNode.value,
                                    0,
                                    newNodeIdentifierLengthMinusOne,
                                )
                            ),
                            character,
                        );
                        nodeToDelete = null;
                        replacementNode = null;
                    };
                };
                case (?parentNode) {};
            };
        };

        // valid insert, insert the node
        return {
            node = newNode;
            nodeToDelete = null;
            replacementNode = null;
        };
    };

    public func buildNodeForEndInsert(
        tree : Tree,
        character : Text,
    ) : Node.Node {
        let rootNodeHasChildren = Node.hasChildren(tree.rootNode);

        // does the title node have any children?
        if (rootNodeHasChildren) {
            let lastNode = getNodeAtPositionFromEnd(tree, 0);

            switch (lastNode) {
                case (null) {
                    Debug.trap("There was an error finding the last node in the tree");

                };
                case (?lastNode) {
                    // insert character after the last node in the tree
                    return Node.Node(
                        getAvailableIdentifierBetween(
                            tree,
                            lastNode.identifier,
                            NodeIdentifier.Identifier(END_NODE_IDENTIFIER),
                        ),
                        character,
                    );
                };
            };
        };

        // if not, insert the character as the first child
        return Node.Node(
            getAvailableIdentifierBetween(tree, NodeIdentifier.Identifier(START_NODE_IDENTIFIER), NodeIdentifier.Identifier(END_NODE_IDENTIFIER)),
            character,
        );
    };

    public func buildNodeForMiddleInsert(
        tree : Tree,
        character : Text,
        position : Nat,
    ) : Node.Node {
        let nodeBeforeCursor = getNodeAtPosition(tree, position - 1);
        if (Node.nullableEqual(?nodeBeforeCursor, null)) Debug.trap(
            "There was an error finding the node before the cursor"
        );

        let nodeAfterCursor = getNodeAtPosition(tree, position);
        if (Node.nullableEqual(?nodeAfterCursor, null)) Debug.trap(
            "There was an error finding the node after the cursor"
        );

        return Node.Node(
            getAvailableIdentifierBetween(
                tree,
                nodeBeforeCursor.identifier,
                nodeAfterCursor.identifier,
            ),
            character,
        );
    };

    public func insertCharacterAtStart(tree : Tree, character : Text) : {
        node : Node.Node;
        deletedNode : ?Node.Node;
        replacementNode : ?Node.Node;
    } {
        let { node; nodeToDelete; replacementNode } = buildNodesForFrontInsert(
            tree,
            character,
        );

        // TODO: Should we be ignoring the result? Probabaly not!
        ignore tree.insert({
            identifier = node.identifier.value;
            value = node.value;
        });

        switch (nodeToDelete) {
            case (null) {};
            case (?nodeToDelete) {
                tree.deleteNode(nodeToDelete.identifier.value);
            };
        };
        switch (replacementNode) {
            case (null) {};
            case (?replacementNode) {
                // TODO: Should we be ignoring the result? Probabaly not!
                ignore tree.insert({
                    identifier = replacementNode.identifier.value;
                    value = replacementNode.value;
                });
            };
        };

        return { node; deletedNode = nodeToDelete; replacementNode };
    };

    public func insertCharacterAtEnd(tree : Tree, character : Text) : Node.Node {
        let node = buildNodeForEndInsert(tree, character);
        // TODO: Should we be ignoring the result? Probabaly not!
        ignore tree.insert({
            identifier = node.identifier.value;
            value = node.value;
        });
        return node;
    };

    public func insertCharacterAtPosition(
        tree : Tree,
        character : Text,
        position : Nat,
    ) : Node.Node {
        let node = buildNodeForMiddleInsert(tree, character, position);
        // TODO: Should we be ignoring the result? Probabaly not!
        ignore tree.insert({
            identifier = node.identifier.value;
            value = node.value;
        });
        return node;
    };

    public func toText(tree : Tree) : Text {
        func buildText(rootNode : Node.Node) : Text {
            var final = switch (rootNode.deletedAt) {
                case (null) { rootNode.value };
                case (?deletedAt) { "" };
            };

            if (rootNode.children.size() == 0) {
                return final;
            };

            let rootNodeBase = Int16.toInt(Int16.fromNat16(rootNode.base));
            label doLoop for (i in Iter.range(0, rootNodeBase)) {
                let childNode = rootNode.children.get(Nat16.fromNat(i));
                switch (childNode) {
                    case (null) { continue doLoop };
                    case (?childNode) { final := final # buildText(childNode) };
                };
            };

            return final;
        };

        return buildText(tree.rootNode);
    };

    /**
     * Get the size of the tree.
     *
     * @param tree
     * @return size of the tree
     */
    public func size(tree : Tree) : Nat {
        return tree.size();
    };

    /**
     * Get a list of available node identifiers in the tree between two given nodes.
     *
     * @param rootNode The root node of the tree.
     * @param nodeA The first node to get the available node identifiers between.
     * @param nodeB The second node to get the available node identifiers between.
     * @return A list of available node identifiers in the tree between two given nodes.
     */
    public func getIdentifierBetween(
        tree : Tree,
        nodeAIdentifier : NodeIdentifier.Identifier,
        nodeBIdentifier : NodeIdentifier.Identifier,
    ) : NodeIdentifier.Identifier {
        let depth = Node.getShallowInsertDepth(nodeAIdentifier, nodeBIdentifier);
        let nodeAPrefix = Node.prefix(nodeAIdentifier, depth);
        let nodeBPrefix = Node.prefix(nodeBIdentifier, depth);
        let step = _calculateStep(tree, nodeAPrefix, nodeBPrefix);

        let allocationStrategy = tree.allocationStrategy(depth);

        switch (allocationStrategy) {
            case (#boundaryPlus) {
                let idIndexToUpdate : Nat = Nat16.toNat(depth) - 1;
                let identifier = Array.mapEntries<NodeIndex, NodeIndex>(
                    nodeAPrefix,
                    func(x, i) {
                        if (idIndexToUpdate == i) return x + step;
                        return x;
                    },
                );

                return NodeIdentifier.Identifier(identifier);
            };
            case (#boundaryMinus) {
                return NodeIdentifier.subtract(NodeIdentifier.Identifier(nodeBPrefix), step);
            };
        };

        Debug.trap("Unrecognized allocation strategy");
    };

    public func getNodeAtPosition(
        tree : Tree,
        position : Nat,
    ) : Node.Node {
        var counter = 0;
        let shouldSkipDeleted = true;

        func shouldReturnNode(currentPosition : Nat, node : Node.Node) : Bool {
            let isTargetPositionReached = currentPosition == position;
            let shouldSkip = shouldSkipNode(node, shouldSkipDeleted);

            if (isTargetPositionReached and not shouldSkipDeleted) return true;
            if (isTargetPositionReached and not shouldSkip) return true;

            return false;
        };

        func doRecursiveFind(
            rootNode : Node.Node
        ) : ?Node.Node {
            if (shouldReturnNode(counter, rootNode)) return ?rootNode;
            if (not shouldSkipNode(rootNode, shouldSkipDeleted)) counter += 1;

            let sortedChildNodes = Array.sort(
                Iter.toArray(rootNode.children.vals()),
                Node.compare,
            );

            for (node in Iter.fromArray(sortedChildNodes)) {
                let foundNode = doRecursiveFind(node);
                if (Node.nullableEqual(foundNode, null)) return foundNode;
            };

            return null;
        };

        let node = doRecursiveFind(tree.rootNode);

        switch (node) {
            case (null) {
                Debug.trap("Node at postion" # debug_show position # "not found");
            };
            case (?node) {
                return node;
            };
        };

    };

    public func getNodeAtPositionFromEnd(
        tree : Tree,
        position : Nat,
    ) : ?Node.Node {
        var counter = 0;
        let shouldSkipDeleted = true;

        func shouldReturnNode(currentPosition : Nat, node : Node.Node) : Bool {
            let isTargetPositionReached = currentPosition == position;
            let shouldSkip = shouldSkipNode(node, shouldSkipDeleted);

            if (isTargetPositionReached and not shouldSkipDeleted) return true;

            if (isTargetPositionReached and not shouldSkip) return true;

            return false;
        };

        let lastNode = findPreviousNode(tree, NodeIdentifier.Identifier(END_NODE_IDENTIFIER));
        switch (lastNode) {
            case (null) {
                return null;
            };
            case (?lastNode) {
                if (shouldReturnNode(counter, lastNode)) return ?lastNode;
                var prevNode : Node.Node = lastNode;

                while (counter <= position) {
                    let node = findPreviousNode(tree, prevNode.identifier);

                    switch (node) {
                        case (null) { return null };
                        case (?node) {
                            if (shouldReturnNode(counter, node)) return ?node;
                            prevNode := node;
                            if (not shouldSkipNode(node, shouldSkipDeleted)) counter += 1;
                        };
                    };
                };
            };
        };

        return null;
    };

    public func findNextNode(
        tree : Tree,
        identifier : NodeIdentifier.Identifier,
    ) : ?Node.Node {
        let originalIdentifier = identifier;
        let originalIdentifierLength = originalIdentifier.length();
        let originalIdentifierLengthMinusOne : Nat = originalIdentifierLength - 1;

        func doRecursiveFind(
            rootNode : Node.Node,
            identifier : NodeIdentifier.Identifier,
            after : NodeIndex,
        ) : ?Node.Node {
            let firstChild = _getFirstChildAfterIndex(rootNode, after);

            switch (firstChild) {
                case (null) {
                    let parentNodeIdentifier = NodeIdentifier.Identifier(
                        Array.subArray<NodeIndex>(identifier.value, 0, originalIdentifierLengthMinusOne)
                    );
                    let parentNode = tree.get(parentNodeIdentifier.value);

                    switch (parentNode) {
                        case (null) {
                            Debug.trap("Unable to get parent node");
                        };
                        case (?parentNode) {
                            return doRecursiveFind(
                                parentNode,
                                parentNodeIdentifier,
                                identifier.value[identifier.length() - 1],
                            );
                        };
                    };
                };
                case (?firstChild) {
                    return ?firstChild;
                };
            };

            return firstChild;
        };

        let currentNode = tree.get(identifier.value);

        switch (currentNode) {
            case (null) {
                Debug.trap("Unable to get current node");
            };
            case (?currentNode) {
                let firstChild = _getFirstChild(currentNode);

                switch (firstChild) {
                    case (null) {
                        let parentNodeIdentifier = NodeIdentifier.Identifier(
                            Array.subArray(identifier.value, 0, originalIdentifierLengthMinusOne)
                        );
                        let parentNode = tree.get(parentNodeIdentifier.value);

                        switch (parentNode) {
                            case (null) {
                                Debug.trap("Unable to get parent node");
                            };
                            case (?parentNode) {
                                return doRecursiveFind(
                                    parentNode,
                                    parentNodeIdentifier,
                                    originalIdentifier.value[originalIdentifierLengthMinusOne],
                                );
                            };
                        };
                    };
                    case (?firstChild) {
                        return ?firstChild;
                    };
                };
            };
        };
    };

    public func last(rootNode : Node.Node) : ?Node.Node {
        let reversedChildren = Array.reverse<Node.Node>(Iter.toArray(rootNode.children.vals()));

        if (rootNode.children.size() == 0) {
            return ?rootNode;
        };

        return last(reversedChildren[0]);
    };

    public func findPreviousNode(
        tree : Tree,
        identifier : NodeIdentifier.Identifier,
    ) : ?Node.Node {
        let rootNode = tree.rootNode;
        let originalIdentifier = identifier;
        let originalIdentifierLength = originalIdentifier.length();
        let originalIdentifierLengthMinusOne : Nat = originalIdentifierLength - 1;
        let originalIndex = Int16.toInt(Int16.fromNat16(identifier.value[originalIdentifierLengthMinusOne]));
        let parentNodeIdentifier = Array.subArray(
            identifier.value,
            0,
            originalIdentifierLengthMinusOne,
        );
        let parentNode = tree.get(parentNodeIdentifier);

        func doRecursiveFind(
            node : Node.Node,
            range : Iter.Iter<Int>,
        ) : ?Node.Node {
            label doLoop for (i in range) {
                let childNode = node.children.get(Nat16.fromNat(Int.abs(i)));

                switch (childNode) {
                    case (null) {
                        continue doLoop;
                    };
                    case (?childNode) {
                        let childNodeBase = Int16.toInt(Int16.fromNat16(childNode.base));
                        let childNodeRange = Iter.revRange(childNodeBase - 1, 0);

                        let foundNode = doRecursiveFind(
                            childNode,
                            childNodeRange,
                        );

                        switch (foundNode) {
                            case (null) {
                                continue doLoop;
                            };
                            case (?foundNode) {
                                return ?foundNode;
                            };
                        };
                    };
                };
            };

            if (Node.compare(node, rootNode) == #equal) {
                return null;
            };

            return ?node;
        };

        if (originalIndex == 0) {
            return null;
        };

        switch (parentNode) {
            case (null) {
                Debug.trap("Unable to get parent node");
            };
            case (?parentNode) {
                let range = Iter.revRange(originalIndex - 1, 0);

                return doRecursiveFind(parentNode, range);
            };
        };
    };

    func _calculateStep(
        tree : Tree,
        prefixA : [NodeIndex],
        prefixB : [NodeIndex],
    ) : NodeIndex {
        let boundary = Nat16.toNat(tree.boundary);
        let interval = Interval.between(prefixA, prefixB);
        let intervalAsInt = Interval.toInt(interval);
        let minimumStep = 1;
        var maximumStep : Nat = switch (boundary > intervalAsInt) {
            case (true) { intervalAsInt };
            case (false) { boundary };
        };

        return Nat16.fromNat(
            getRandomNumberBetween(
                minimumStep,
                maximumStep,
            )
        );
    };

    func _getFirstChild(rootNode : Node.Node) : ?Node.Node {
        for (childNode in rootNode.children.vals()) {
            return ?childNode;
        };

        return null;
    };

    func _getFirstChildAfterIndex(
        rootNode : Node.Node,
        index : NodeIndex,
    ) : ?Node.Node {
        label doLoop for (i in Iter.range(Nat16.toNat(index) + 1, Int16.toInt(Int16.fromNat16(rootNode.base)) - 1)) {
            let childNode = rootNode.children.get(Nat16.fromNat(i));

            switch (childNode) {
                case (null) {
                    continue doLoop;
                };
                case (?childNode) {
                    return ?childNode;
                };
            };
        };

        return null;
    };
};
