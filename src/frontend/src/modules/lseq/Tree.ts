import * as Node from './Node';
import {
  DEFAULT_BOUNDARY,
  END_NODE_ID,
  IdentifierCollisionError,
  START_NODE_ID,
} from './constants';
import * as Identifier from './identifier';
import * as Interval from './interval';
import * as Types from './types';
import { base, getRandomNumberBetween } from './utils';

type NodeBoundary = Types.NodeBoundary;
type NodeDepth = Types.NodeDepth;
type NodeIndex = Types.NodeIndex;
type NodeValue = Types.NodeValue;

type AllocationStrategy = { boundaryPlus: null } | { boundaryMinus: null };

function shouldSkipNode(node: Node.Node, shouldSkipDeleted = true) {
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
    const identifierLength = identifier.length;
    if (identifierLength == 0) throw new Error('Invalid Identifier');

    let currentNode = this.rootNode;

    for (let i = 0; i < identifierLength; i++) {
      const identifierPart = identifier.value[i];
      const childNode = currentNode.children.get(identifierPart);
      const currentNodeBase = currentNode.base;
      const currentNodeBaseMinusOne = currentNodeBase - 1;

      if (identifierPart > currentNodeBaseMinusOne || identifierLength < 1) {
        throw new Error('Invalid Identifier');
      }

      if (i == identifierLength - 1) {
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
      const identifierLength = identifier.length;

      if (identifierLength == 0) {
        return root;
      }

      const { base } = root;

      for (let i = 0; i < base; i++) {
        const childNode = root.children.get(i);

        if (!childNode) continue;

        const identifierLength = identifier.length;
        const newIdentifier = new Identifier.Identifier(
          identifier.value.slice(1, identifierLength)
        );

        if (i == identifier.value[0]) {
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

      for (let i = 0; i < childCount; i++) {
        const childNode = rootNode.children.get(i);
        if (!childNode) continue;
        final += calculateSize(childNode);
        if (!shouldSkipNode(childNode, shouldSkipDeleted)) {
          final += 1;
        }
      }

      return final;
    }

    return calculateSize(this.rootNode);
  }
}

function checkNodeAvailable(tree: Tree, identifier: Identifier.Identifier) {
  return !tree.get(identifier);
}

function getAvailableIdentifierBetween(
  tree: Tree,
  identifierA: Identifier.Identifier,
  identifierB: Identifier.Identifier
) {
  let newIdentifier = getIdentifierBetween(tree, identifierA, identifierB);
  const maxLoopCount = 100;
  let loopCounter = 0;

  while (checkNodeAvailable(tree, newIdentifier) === false) {
    if (loopCounter === maxLoopCount) {
      throw new Error('Unable to find available node identifier');
    }

    newIdentifier = getIdentifierBetween(tree, newIdentifier, identifierB);
    loopCounter++;
  }

  return newIdentifier;
}

export function buildNodesForFrontInsert(
  tree: Tree,
  character: string
): {
  node: Node.Node;
  nodeToDelete?: Node.Node;
  replacementNode?: Node.Node;
} {
  const rootNodeHasChildren = Node.hasChildren(tree.rootNode);

  if (!rootNodeHasChildren) {
    // Root node has no children, insert the character as the first child
    const newNode = new Node.Node(
      getAvailableIdentifierBetween(tree, START_NODE_ID, END_NODE_ID),
      character
    );

    return { node: newNode };
  }

  const firstNode = getNodeAtPosition(tree, 0);

  if (!firstNode) {
    throw new Error('There was an error finding the first node in the tree');
  }

  const firstNodeIdenfier = firstNode.identifier;
  const isFirstNodeEarliestPossibleChildNode =
    firstNodeIdenfier.length === 1
      ? firstNodeIdenfier.value[firstNodeIdenfier.value.length - 1] === 1
      : firstNodeIdenfier.value[firstNodeIdenfier.value.length - 1] === 0;

  if (isFirstNodeEarliestPossibleChildNode) {
    // Delete the first node in the tree and insert the character after it
    const deletedCharacter = firstNode.value;
    const followingNode = findNextNode(tree, firstNode.identifier);
    const followingNodeIdentifier = followingNode
      ? followingNode.identifier
      : END_NODE_ID;

    const newNode = new Node.Node(
      getAvailableIdentifierBetween(
        tree,
        firstNode.identifier,
        followingNodeIdentifier
      ),
      character
    );
    const replacementNode = new Node.Node(
      getAvailableIdentifierBetween(
        tree,
        newNode.identifier,
        followingNodeIdentifier
      ),
      deletedCharacter
    );

    return { node: newNode, nodeToDelete: firstNode, replacementNode };
  }

  // create a node before the first node in the tree
  const identifierForNewNode = getAvailableIdentifierBetween(
    tree,
    START_NODE_ID,
    firstNode.identifier
  );
  const newNode = new Node.Node(identifierForNewNode, character);

  // check if this will be out of order insert
  if (
    identifierForNewNode.length > 1 &&
    !tree.get(
      new Identifier.Identifier(
        identifierForNewNode.value.slice(0, identifierForNewNode.length - 1)
      )
    )
  ) {
    // out of order insert, create parent node
    return {
      node: new Node.Node(
        new Identifier.Identifier(
          identifierForNewNode.value.slice(0, identifierForNewNode.length - 1)
        ),
        character
      ),
    };
  }

  return { node: newNode };
}

export function buildNodeForEndInsert(
  tree: Tree,
  character: string
): Node.Node {
  const rootNodeHasChildren = Node.hasChildren(tree.rootNode);

  // does the title node have any children?
  if (rootNodeHasChildren) {
    const lastNode = getNodeAtPositionFromEnd(tree, 0);

    if (!lastNode) {
      throw new Error('There was an error finding the last node in the tree');
    }

    // insert character after the last node in the tree
    return new Node.Node(
      getAvailableIdentifierBetween(tree, lastNode.identifier, END_NODE_ID),
      character
    );
  }

  // if not, insert the character as the first child
  return new Node.Node(
    getAvailableIdentifierBetween(tree, START_NODE_ID, END_NODE_ID),
    character
  );
}

export function buildNodeForMiddleInsert(
  tree: Tree,
  character: string,
  position: number
): Node.Node {
  const nodeBeforeCursor = getNodeAtPosition(tree, position - 1);
  if (!nodeBeforeCursor) {
    throw new Error('There was an error finding the node before the cursor');
  }

  const nodeAfterCursor = getNodeAtPosition(tree, position);
  if (!nodeAfterCursor) {
    throw new Error('There was an error finding the node after the cursor');
  }

  return new Node.Node(
    getAvailableIdentifierBetween(
      tree,
      nodeBeforeCursor.identifier,
      nodeAfterCursor.identifier
    ),
    character
  );
}

export function insertCharacterAtStart(tree: Tree, character: string) {
  const { node, nodeToDelete, replacementNode } = buildNodesForFrontInsert(
    tree,
    character
  );

  tree.insert(node);
  if (nodeToDelete) tree.delete(nodeToDelete.identifier);
  if (replacementNode) tree.insert(replacementNode);

  return { node, deletedNode: nodeToDelete, replacementNode };
}

export function insertCharacterAtEnd(tree: Tree, character: string) {
  const node = buildNodeForEndInsert(tree, character);
  tree.insert(node);
  return node;
}

export function insertCharacterAtPosition(
  tree: Tree,
  character: string,
  position: number
) {
  const node = buildNodeForMiddleInsert(tree, character, position);
  tree.insert(node);
  return node;
}

export function toText(tree: Tree): string {
  function buildText(rootNode: Node.Node): string {
    let final = rootNode.deletedAt ? '' : rootNode.value;

    if (rootNode.children.size === 0) {
      return final;
    }

    for (let i = 0; i < rootNode.base; i++) {
      const childNode = rootNode.children.get(i);
      if (!childNode) continue;
      final += buildText(childNode);
    }

    return final;
  }

  return buildText(tree.rootNode);
}

/**
 * Get the size of the tree.
 *
 * @param tree
 * @return size of the tree
 */
export function size(tree: Tree): number {
  return tree.size();
}

/**
 * Get a list of available node identifiers in the tree between two given nodes.
 *
 * @param rootNode The root node of the tree.
 * @param nodeA The first node to get the available node identifiers between.
 * @param nodeB The second node to get the available node identifiers between.
 * @return A list of available node identifiers in the tree between two given nodes.
 */
export function getIdentifierBetween(
  tree: Tree,
  nodeAIdentifier: Identifier.Identifier,
  nodeBIdentifier: Identifier.Identifier
): Identifier.Identifier {
  const depth = Node.getShallowInsertDepth(nodeAIdentifier, nodeBIdentifier);
  const nodeAPrefix = Node.prefix(nodeAIdentifier, depth);
  const nodeBPrefix = Node.prefix(nodeBIdentifier, depth);
  const step = _calculateStep(tree, nodeAPrefix, nodeBPrefix);

  const allocationStrategy = tree.allocationStrategy(depth);

  if ('boundaryPlus' in allocationStrategy) {
    const idIndexToUpdate = depth - 1;
    const identifier = nodeAPrefix;
    identifier.value[idIndexToUpdate] =
      identifier.value[idIndexToUpdate] + step;

    return nodeAPrefix;
  }

  if ('boundaryMinus' in allocationStrategy) {
    return Identifier.subtract(nodeBPrefix, step);
  }

  throw new Error('Unrecognized allocation strategy');
}

export function getNodeAtPosition(
  tree: Tree,
  position: number,
  options: { shouldSkipDeleted?: boolean } = {}
): Node.Node {
  let counter = 0;
  const { shouldSkipDeleted = true } = options;

  function shouldReturnNode(currentPosition: number, node: Node.Node) {
    const isTargetPositionReached = currentPosition === position;
    const shouldSkip = shouldSkipNode(node);

    if (isTargetPositionReached && !shouldSkipDeleted) return true;

    if (isTargetPositionReached && !shouldSkip) return true;

    return false;
  }

  function doRecursiveFind(rootNode: Node.Node): Node.Node | null | undefined {
    if (shouldReturnNode(counter, rootNode)) return rootNode;
    if (!shouldSkipNode(rootNode)) counter++;

    for (const node of Array.from(rootNode.children.values()).sort(
      (nodeA, nodeB) => Node.compare(nodeA, nodeB)
    )) {
      const foundNode = doRecursiveFind(node);
      if (foundNode) return foundNode;
    }
  }

  const node = doRecursiveFind(tree.rootNode);

  if (!node) throw new Error(`Node at postion ${position} not found`);
  return node;
}

export function getNodeAtPositionFromEnd(
  tree: Tree,
  position: number,
  options: { shouldSkipDeleted?: boolean } = {}
): Node.Node | null {
  let counter = 0;
  const { shouldSkipDeleted = true } = options;

  function shouldReturnNode(currentPosition: number, node: Node.Node) {
    const isTargetPositionReached = currentPosition === position;
    const shouldSkip = shouldSkipNode(node);

    if (isTargetPositionReached && !shouldSkipDeleted) return true;

    if (isTargetPositionReached && !shouldSkip) return true;

    return false;
  }

  const lastNode = findPreviousNode(tree, END_NODE_ID);
  if (!lastNode) return null;
  if (shouldReturnNode(counter, lastNode)) return lastNode;

  let prevNode: Node.Node | null = lastNode;

  while (counter <= position) {
    const node = findPreviousNode(tree, prevNode.identifier);
    if (!node) return null;
    if (shouldReturnNode(counter, node)) return node;
    prevNode = node;
    if (!shouldSkipNode(node, shouldSkipDeleted)) counter++;
  }

  return null;
}

export function findNextNode(
  tree: Tree,
  identifier: Identifier.Identifier
): Node.Node | null {
  const originalIdentifier = identifier;
  const originalIdentifierLength = originalIdentifier.length;
  const originalIdentifierLengthMinusOne = originalIdentifierLength - 1;

  function doRecursiveFind(
    rootNode: Node.Node,
    identifier: Identifier.Identifier,
    after: number
  ): Node.Node | null {
    const firstChild = _getFirstChildAfterIndex(rootNode, after);

    if (!firstChild) {
      const parentNodeIdentifier = new Identifier.Identifier(
        identifier.value.slice(0, originalIdentifierLengthMinusOne)
      );
      const parentNode = tree.get(parentNodeIdentifier);

      if (!parentNode) {
        throw new Error('This node has no children or parent node');
      }

      return doRecursiveFind(
        parentNode,
        parentNodeIdentifier,
        identifier.value[identifier.length - 1]
      );
    }

    return firstChild;
  }

  const currentNode = tree.get(identifier);

  if (!currentNode) {
    throw new Error('Unable to get current node');
  }

  const firstChild = _getFirstChild(currentNode);

  if (!firstChild) {
    const parentNodeIdentifier = new Identifier.Identifier(
      identifier.value.slice(0, originalIdentifierLengthMinusOne)
    );
    const parentNode = tree.get(parentNodeIdentifier);

    if (!parentNode) {
      throw new Error('This node has no children or parent node');
    }

    return doRecursiveFind(
      parentNode,
      parentNodeIdentifier,
      originalIdentifier.value[originalIdentifierLengthMinusOne]
    );
  }

  return firstChild;
}

export function last(rootNode: Node.Node): Node.Node | null {
  const reversedChildren = Array.from(rootNode.children.values()).reverse();

  if (rootNode.children.size === 0) {
    return rootNode;
  }

  return last(reversedChildren[0]);
}

export function findPreviousNode(
  tree: Tree,
  identifier: Identifier.Identifier
): Node.Node | null {
  const { rootNode } = tree;
  const originalIdentifier = identifier;
  const originalIdentifierLength = originalIdentifier.length;
  const originalIdentifierLengthMinusOne = originalIdentifier.length - 1;
  const originalIndex = identifier.value[originalIdentifierLength - 1];
  const parentNodeIdentifier = new Identifier.Identifier(
    identifier.value.slice(0, originalIdentifierLengthMinusOne)
  );
  const parentNode = tree.get(parentNodeIdentifier);

  function doRecursiveFind(node: Node.Node, range: number[]): Node.Node | null {
    for (const i of range) {
      const childNode = node.children.get(i);
      if (!childNode) continue;

      const childNodeBase = childNode.base;
      const childNodeRange = Array.from({ length: childNodeBase }, (_, i) => i);

      const foundNode = doRecursiveFind(childNode, childNodeRange.reverse());

      if (foundNode) {
        return foundNode;
      }
    }

    if (Node.compare(node, rootNode) === 0) {
      return null;
    }

    return node;
  }

  if (originalIndex === 0) {
    return null;
  }

  if (!parentNode) {
    throw new Error('Unable to get parent node');
  }

  const range = Array.from(
    { length: originalIndex },
    (_, i) => originalIndex - 1 - i
  );
  return doRecursiveFind(parentNode, range);
}

function _calculateStep(
  tree: Tree,
  prefixA: Identifier.Identifier,
  prefixB: Identifier.Identifier
): NodeIndex {
  const { boundary } = tree;
  const interval = Interval.between(prefixA, prefixB);
  const intervalAsInt = interval.value[interval.value.length - 1]; // TODO: fix this
  const minimumStep = 1;
  const maximumStep = boundary > intervalAsInt ? intervalAsInt : boundary;

  return getRandomNumberBetween(minimumStep, maximumStep);
}

function _getFirstChild(rootNode: Node.Node): Node.Node | null {
  for (const childNode of rootNode.children.values()) {
    return childNode;
  }
  return null;
}

function _getFirstChildAfterIndex(
  rootNode: Node.Node,
  index: number
): Node.Node | null | undefined {
  for (let i = index + 1; i < rootNode.base; i++) {
    const childNode = rootNode.children.get(i);

    if (!childNode) {
      continue;
    }

    return childNode;
  }
}
