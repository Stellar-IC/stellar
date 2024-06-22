import {
  DEFAULT_BOUNDARY,
  END_NODE_ID,
  IdentifierCollisionError,
  START_NODE_ID,
} from '../constants';
import * as Identifier from '../identifier';
import * as Node from '../node';
import {
  AllocationStrategy,
  NodeBoundary,
  NodeDepth,
  NodeValue,
} from '../types';

function _shouldSkipNode(node: Node.Node, shouldSkipDeleted = true) {
  return (
    (shouldSkipDeleted && node.deletedAt !== null) ||
    Node.isEdgeNode(node) ||
    Node.isRootNode(node)
  );
}

export class Tree {
  allocationStrategies: Map<NodeDepth, AllocationStrategy>;
  boundary: NodeBoundary;
  rootNode: Node.Node;

  constructor(
    options: {
      allocationStrategies?: Map<NodeDepth, AllocationStrategy>;
      boundary?: NodeBoundary;
      rootNode?: Node.Node;
    } = {}
  ) {
    const startNode = new Node.Node(START_NODE_ID, '');
    const endNode = new Node.Node(END_NODE_ID, '');
    const {
      allocationStrategies = new Map<NodeDepth, AllocationStrategy>(),
      boundary = DEFAULT_BOUNDARY,
      rootNode = new Node.Node(new Identifier.Identifier([]), ''),
    } = options;

    rootNode.children.set(START_NODE_ID.value[0], startNode);
    rootNode.children.set(END_NODE_ID.value[0], endNode);

    this.allocationStrategies = allocationStrategies;
    this.boundary = boundary;
    this.rootNode = rootNode;
  }

  /**
   * Insert a node into the tree.
   *
   * This function will insert a node into the tree, given a node identifier.
   *
   * @param node The node to insert.
   * @return None
   */
  insert(node: { identifier: Identifier.Identifier; value: NodeValue }) {
    const { identifier, value } = node;
    const identifierLength = identifier.value.length;
    if (identifierLength === 0) throw new Error('Invalid Identifier');

    let currentNode = this.rootNode;

    for (let i = 0; i < identifierLength; i += 1) {
      const identifierPart = identifier.value[i];
      const childNode = currentNode.children.get(identifierPart);
      const currentBase = currentNode.base;

      if (identifierPart > currentBase - 1 || identifierLength < 1) {
        throw new Error('Invalid Identifier');
      }

      if (i === identifierLength - 1) {
        if (childNode) {
          throw new IdentifierCollisionError('Identifier already in use');
        }

        currentNode.children.set(
          identifierPart,
          new Node.Node(identifier, value)
        );

        return;
      }

      if (!childNode) throw new Error(`Out of order insert at ${identifier}`);

      currentNode = childNode;
    }
  }

  /**
   * Insert multiple nodes into the tree.
   *
   * @param nodes The nodes to insert.
   * @return None
   * @see insert
   **/
  insertMany(nodes: { identifier: Identifier.Identifier; value: NodeValue }[]) {
    for (const node of nodes) {
      const { identifier, value } = node;
      this.insert({ identifier, value });
    }
  }

  delete(identifier: Identifier.Identifier) {
    const node = this.get(identifier);
    if (!node) return;
    node.deletedAt = new Date();
  }

  allocationStrategy(depth: NodeDepth): AllocationStrategy {
    let allocationStrategy = this.allocationStrategies.get(depth);

    if (!allocationStrategy) {
      let strategy: AllocationStrategy = { boundaryPlus: null };

      // choose random allocation strategy
      if (Math.random() < 0.5) {
        strategy = { boundaryPlus: null };
      } else {
        strategy = { boundaryMinus: null };
      }

      allocationStrategy = strategy;
    }

    if (!allocationStrategy) throw new Error('Allocation strategy not set');

    this.allocationStrategies.set(depth, allocationStrategy);

    return allocationStrategy;
  }

  /**
   * Get a node from the tree.
   *
   * This function will get a node from the tree, given a node identifier.
   *
   * @param rootNode The root node of the tree.
   * @param identifier The identifier of the node to get.
   * @return The node, or null if the node does not exist.
   */
  get(identifier: Identifier.Identifier): Node.Node | null | undefined {
    function doRecursiveFind(
      root: Node.Node,
      identifier: Identifier.Identifier
    ): Node.Node | null | undefined {
      const identifierLength = identifier.value.length;

      if (identifierLength === 0) {
        return root;
      }

      const { base } = root;

      for (let i = 0; i < base; i += 1) {
        const childNode = root.children.get(i);

        if (!childNode) continue;

        const identifierLength = identifier.value.length;
        const newIdentifier = new Identifier.Identifier(
          identifier.value.slice(1, identifierLength)
        );

        if (i === identifier.value[0]) {
          return doRecursiveFind(childNode, newIdentifier);
        }
        continue;
      }

      return null;
    }

    return doRecursiveFind(this.rootNode, identifier);
  }

  size(options: { shouldSkipDeleted?: boolean } = {}): number {
    const { shouldSkipDeleted = true } = options;

    function calculateSize(rootNode: Node.Node): number {
      if (rootNode.children.size === 0) return 0;

      let final = 0;
      const childCount = rootNode.base;

      for (let i = 0; i < childCount; i += 1) {
        const childNode = rootNode.children.get(i);
        if (!childNode) continue;
        final += calculateSize(childNode);
        if (!_shouldSkipNode(childNode, shouldSkipDeleted)) {
          final += 1;
        }
      }

      return final;
    }

    return calculateSize(this.rootNode);
  }
}
