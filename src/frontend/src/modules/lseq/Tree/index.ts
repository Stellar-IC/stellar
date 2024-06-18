import { Stack } from 'js-sdsl';

import * as Node from '../Node';
import {
  DEFAULT_BOUNDARY,
  END_NODE_ID,
  IdentifierCollisionError,
  START_NODE_ID,
} from '../constants';
import * as Identifier from '../identifier';
import * as Interval from '../interval';
import {
  NodeIndex,
  TreeEvent,
  AllocationStrategy,
  NodeDepth,
  NodeBoundary,
  NodeValue,
} from '../types';
import { getRandomNumberBetween } from '../utils';

function _shouldSkipNode(node: Node.Node, shouldSkipDeleted = true) {
  return (
    (shouldSkipDeleted && node.deletedAt !== null) ||
    Node.isEdgeNode(node) ||
    Node.isRootNode(node)
  );
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
  if (rootNode.children.size > 0) {
    return rootNode.children.values().next().value;
  }
  return null;
}

function _getFirstChildAfterIndex(
  rootNode: Node.Node,
  index: number
): Node.Node | null {
  for (let i = index + 1; i < rootNode.base; i += 1) {
    const childNode = rootNode.children.get(i);

    if (!childNode) {
      continue;
    }

    return childNode;
  }

  return null;
}

function _shouldReturnNode(
  isTargetPositionReached: boolean,
  node: Node.Node,
  shouldSkipDeleted = true
) {
  if (isTargetPositionReached && !_shouldSkipNode(node, shouldSkipDeleted)) {
    return true;
  }

  return false;
}

function _checkNodeAvailable(tree: Tree, identifier: Identifier.Identifier) {
  return !tree.get(identifier);
}

/**
 * Get a valid node identifier for a node between the two given nodes
 *
 * @param rootNode The root node of the tree.
 * @param nodeA The first node to get the available node identifiers between.
 * @param nodeB The second node to get the available node identifiers between.
 * @return A list of available node identifiers in the tree between two given nodes.
 */
function _getIdentifierBetween(
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

    identifier.value[idIndexToUpdate] += step;

    return nodeAPrefix;
  }

  if ('boundaryMinus' in allocationStrategy) {
    return Identifier.subtract(nodeBPrefix, step);
  }

  throw new Error('Unrecognized allocation strategy');
}

/**
 * Get an available node identifier in the tree between two given nodes.
 *
 * @param tree The tree to get the available node identifier in.
 * @param identifierA The first node to get the available node identifier between.
 * @param identifierB The second node to get the available node identifier between.
 * @return An available node identifier in the tree between two given nodes.
 */
function _getAvailableIdentifierBetween(
  tree: Tree,
  identifierA: Identifier.Identifier,
  identifierB: Identifier.Identifier
) {
  let newIdentifier = _getIdentifierBetween(tree, identifierA, identifierB);
  const maxLoopCount = 100;
  let loopCounter = 0;

  while (_checkNodeAvailable(tree, newIdentifier) === false) {
    if (loopCounter === maxLoopCount) {
      throw new Error('Unable to find available node identifier');
    }

    newIdentifier = _getIdentifierBetween(tree, newIdentifier, identifierB);
    loopCounter += 1;
  }

  return newIdentifier;
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

/**
 * Create a copy a tree.
 *
 * @param tree The tree to clone.
 * @return A copy of the tree.
 */
export function clone(tree: Tree): Tree {
  const clonedTree = new Tree({
    boundary: tree.boundary,
    allocationStrategies: tree.allocationStrategies,
  });

  iterate(tree, (node) => {
    if (Node.isRootNode(node)) return;
    if (Node.isEdgeNode(node)) return;

    clonedTree.insert({
      identifier: node.identifier,
      value: node.value,
    });

    if (node.deletedAt != null) {
      const clonedNode = clonedTree.get(node.identifier);

      if (!clonedNode) {
        throw new Error('Unable to get cloned node');
      }

      clonedNode.deletedAt = node.deletedAt;
    }
  });

  return clonedTree;
}

/**
 * Get the node at a given position in the tree.
 * @param tree The tree to get the node from.
 * @param position The position of the node to get.
 * @param options Options for getting the node at a given position.
 * @return The node at the given position in the tree.
 */
export function getNodeAtPosition(
  tree: Tree,
  position: number,
  options: { shouldSkipDeleted?: boolean } = {}
): Node.Node | null {
  let counter = 0;
  const { shouldSkipDeleted = true } = options;

  function doRecursiveFind(rootNode: Node.Node): Node.Node | null {
    if (_shouldReturnNode(counter === position, rootNode, shouldSkipDeleted)) {
      return rootNode;
    }
    if (!_shouldSkipNode(rootNode)) counter += 1;

    for (const node of Array.from(rootNode.children.values()).sort(
      (nodeA, nodeB) => Node.compare(nodeA, nodeB)
    )) {
      const foundNode = doRecursiveFind(node);
      if (foundNode) return foundNode;
    }

    return null;
  }

  const node = doRecursiveFind(tree.rootNode);

  return node || null;
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
 * Find the next node in the tree.
 *
 * @param tree
 * @param identifier the identifier of the current node
 * @returns the next node in the tree or null if there is none
 */
export function findNextNode(
  tree: Tree,
  identifier: Identifier.Identifier
): Node.Node | null {
  const originalIdentifier = identifier;
  const originalIdentifierLength = originalIdentifier.value.length;
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
        throw new Error('This node has no children and no parent node');
      }

      return doRecursiveFind(
        parentNode,
        parentNodeIdentifier,
        identifier.value[identifier.value.length - 1]
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

/**
 * Find the previous node in the tree.
 *
 * @param tree
 * @param identifier the identifier of the current node
 * @returns the previous node in the tree or null if there is none
 */
export function findPreviousNode(
  tree: Tree,
  identifier: Identifier.Identifier
): Node.Node | null {
  const { rootNode } = tree;
  const originalIdentifier = identifier;
  const originalIdentifierLength = originalIdentifier.value.length;
  const originalIdentifierLengthMinusOne = originalIdentifier.value.length - 1;
  const originalIndex = identifier.value[originalIdentifierLength - 1];
  const parentNodeIdentifier = new Identifier.Identifier(
    identifier.value.slice(0, originalIdentifierLengthMinusOne)
  );
  const parentNode = tree.get(parentNodeIdentifier);

  function doRecursiveFind(node: Node.Node, range: number[]): Node.Node | null {
    for (const i of range) {
      const childNode = node.children.get(i);
      if (!childNode) continue;

      const childNodeRange = Array.from(childNode.children.keys()).sort(
        (a, b) => b - a
      );
      const foundNode = doRecursiveFind(childNode, childNodeRange);

      if (foundNode) return foundNode;
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

  const range = Array.from(parentNode.children.keys())
    .sort((a, b) => b - a)
    .filter((i) => i < originalIndex);

  return doRecursiveFind(parentNode, range);
}

/**
 * Get the node at a given position relative to the end of the tree.
 * @param tree
 * @param position
 * @param options
 * @returns
 */
export function getNodeAtPositionFromEnd(
  tree: Tree,
  position: number,
  options: { shouldSkipDeleted?: boolean } = {}
): Node.Node | null {
  let counter = 0;
  const { shouldSkipDeleted = true } = options;
  const lastNode = findPreviousNode(tree, END_NODE_ID);

  if (!lastNode) return null;

  if (_shouldReturnNode(counter === position, lastNode, shouldSkipDeleted)) {
    return lastNode;
  }

  if (!_shouldSkipNode(lastNode, shouldSkipDeleted)) counter += 1;

  let prevNode: Node.Node | null = lastNode;

  while (counter <= position) {
    const node = findPreviousNode(tree, prevNode.identifier);
    if (!node) return null;
    if (_shouldReturnNode(counter === position, node, shouldSkipDeleted)) {
      return node;
    }
    prevNode = node;
    if (!_shouldSkipNode(node, shouldSkipDeleted)) counter += 1;
  }

  return null;
}

function _createNodeBetweenIdentifiers(
  tree: Tree,
  nodeAIdentifier: Identifier.Identifier,
  nodeBIdentifier: Identifier.Identifier,
  value: string
): Node.Node {
  const identifier = _getAvailableIdentifierBetween(
    tree,
    nodeAIdentifier,
    nodeBIdentifier
  );

  return new Node.Node(identifier, value);
}

/**
 * Build nodes for inserting a character at the start of the tree.
 *
 * @param tree
 * @param character
 * @returns the node to insert, the node to delete if any, and
 *          the node to replace the deleted node with if any
 * @deprecated use insertCharacter or removeCharacter instead
 */
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
    const newNode = _createNodeBetweenIdentifiers(
      tree,
      START_NODE_ID,
      END_NODE_ID,
      character
    );

    return { node: newNode };
  }

  const firstNode = getNodeAtPosition(tree, 0);

  if (!firstNode) {
    throw new Error('There was an error finding the first node in the tree');
  }

  const firstNodeIdentifier = firstNode.identifier;
  const isFirstNodeEarliestPossibleChildNode =
    firstNodeIdentifier.value.length === 1
      ? firstNodeIdentifier.value[firstNodeIdentifier.value.length - 1] === 1
      : firstNodeIdentifier.value[firstNodeIdentifier.value.length - 1] === 0;

  if (isFirstNodeEarliestPossibleChildNode) {
    // Delete the first node in the tree and insert the character after it
    const deletedCharacter = firstNode.value;
    const followingNode = findNextNode(tree, firstNode.identifier);
    const followingNodeIdentifier = followingNode
      ? followingNode.identifier
      : END_NODE_ID;

    const newNode = _createNodeBetweenIdentifiers(
      tree,
      firstNode.identifier,
      followingNodeIdentifier,
      character
    );
    const replacementNode = _createNodeBetweenIdentifiers(
      tree,
      newNode.identifier,
      followingNodeIdentifier,
      deletedCharacter
    );

    return { node: newNode, nodeToDelete: firstNode, replacementNode };
  }

  // create a node before the first node in the tree
  const newNode = _createNodeBetweenIdentifiers(
    tree,
    START_NODE_ID,
    firstNode.identifier,
    character
  );
  const newNodeIdentifier = newNode.identifier;
  const parentNodeIdentifier = new Identifier.Identifier(
    newNodeIdentifier.value.slice(0, newNodeIdentifier.value.length - 1)
  );

  // check if this will be out of order insert
  if (newNodeIdentifier.value.length > 1 && !tree.get(parentNodeIdentifier)) {
    // out of order insert, create parent node
    return {
      node: new Node.Node(parentNodeIdentifier, character),
    };
  }

  return { node: newNode };
}

/**
 * Build a node for inserting a character at the end of the tree.
 *
 * @param tree
 * @param character
 * @returns the node to insert
 * @throws {Error} if there was an error finding the last node in the tree
 * @deprecated use insertCharacter or removeCharacter instead
 */
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
      _getAvailableIdentifierBetween(tree, lastNode.identifier, END_NODE_ID),
      character
    );
  }

  // if not, insert the character as the first child
  return new Node.Node(
    _getAvailableIdentifierBetween(tree, START_NODE_ID, END_NODE_ID),
    character
  );
}

/**
 * Build a node for inserting a character at the middle of the tree.
 *
 * @param tree
 * @param character
 * @param position
 * @returns the node to insert
 * @throws {Error} if there was an error finding the node before the cursor
 * @deprecated use insertCharacter or removeCharacter instead
 */
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
    _getAvailableIdentifierBetween(
      tree,
      nodeBeforeCursor.identifier,
      nodeAfterCursor.identifier
    ),
    character
  );
}

/**
 * Insert a value at the start of the tree.
 *
 * @param tree
 * @param value
 * @returns the node that was inserted, the node that was deleted if any,
 *         and the node that was inserted to replace the deleted node if any
 */
function _insertCharacterAtStart(tree: Tree, character: string) {
  const { node, nodeToDelete, replacementNode } = buildNodesForFrontInsert(
    tree,
    character
  );
  tree.insert(node);

  if (nodeToDelete) tree.delete(nodeToDelete.identifier);
  if (replacementNode) tree.insert(replacementNode);

  return { node, deletedNode: nodeToDelete, replacementNode };
}

/**
 * Insert a value at the end of the tree.
 *
 * @param tree
 * @param value
 * @returns the node that was inserted
 */
function _insertCharacterAtEnd(tree: Tree, character: string) {
  const node = buildNodeForEndInsert(tree, character);
  tree.insert(node);
  return node;
}

/**
 * Insert a value at a given position in the tree.
 *
 * @param tree
 * @param value
 * @param position
 * @returns the node that was inserted
 */
function _insertCharacterAtPosition(
  tree: Tree,
  character: string,
  position: number
) {
  const node = buildNodeForMiddleInsert(tree, character, position);
  tree.insert(node);
  return node;
}

function _createInsertEvent(node: Node.Node): TreeEvent {
  return {
    insert: {
      position: node.identifier.value,
      value: node.value,
      transactionType: {
        insert: null,
      },
    },
  };
}

function _createDeleteEvent(node: Node.Node): TreeEvent {
  return {
    delete: {
      position: node.identifier.value,
      transactionType: {
        delete: null,
      },
    },
  };
}

/**
 * Insert a value at a given position in the tree.
 *
 * @param tree the tree to insert the character into
 * @param position the position to insert the character
 * @param character the character to insert
 * @returns list of events that occurred during the insert
 */
export function insertCharacter(
  tree: Tree,
  position: number,
  character: string
): TreeEvent[] {
  const treeSize = size(tree);
  const isAtStart = position === 0;
  const isAtEnd = position === treeSize;

  if (position < 0 || position > treeSize) {
    throw new Error(
      `Position (${position}) out of range. Tree size: ${treeSize}`
    );
  }

  if (isAtStart) {
    const result = _insertCharacterAtStart(tree, character);
    const { node, deletedNode, replacementNode } = result;
    const events: TreeEvent[] = [_createInsertEvent(node)];

    if (deletedNode) events.push(_createDeleteEvent(deletedNode));
    if (replacementNode) events.push(_createInsertEvent(replacementNode));

    return events;
  }

  if (isAtEnd) {
    const insertedNode = _insertCharacterAtEnd(tree, character);
    const events = [_createInsertEvent(insertedNode)];

    return events;
  }

  const insertedNode = _insertCharacterAtPosition(tree, character, position);
  const event = _createInsertEvent(insertedNode);

  return [event];
}

/**
 * Iterate over the nodes in the tree and call a callback for each node.
 *
 * @param tree
 * @param callback
 */
export function iterate(tree: Tree, callback: (node: Node.Node) => void) {
  const stack = new Stack<Node.Node>();
  stack.push(tree.rootNode);

  while (stack.size() > 0) {
    const node = stack.top();

    if (!node) throw new Error('Found a null node in the stack');

    callback(node);
    stack.pop();

    const children = Array.from(node.children.values())
      .sort(Node.compare)
      .reverse();

    for (const child of children) {
      stack.push(child);
    }
  }
}

/**
 * Remove a character at a given position in the tree.
 *
 * @param tree the tree to remove the character from
 * @param position the position to remove the character
 * @returns event that occurred during the remove or void if the position is at the start
 * @throws {Error} if there was an error finding the node before the cursor
 */
export function removeCharacter(tree: Tree, position: number): TreeEvent {
  const nodeToDelete = getNodeAtPosition(tree, position);

  if (!nodeToDelete) {
    throw new Error('There was an error finding the node to delete');
  }

  tree.delete(nodeToDelete.identifier);

  const event = _createDeleteEvent(nodeToDelete);

  return event;
}

/**
 * Get the value of the tree as an array.
 *
 * @param tree
 * @returns the value of the tree as an array
 */
export function toArray(tree: Tree): string[] {
  const final: string[] = [];

  iterate(tree, (node) => {
    if (!_shouldSkipNode(node)) final.push(node.value);
  });

  return final;
}

/**
 * Get the value of the tree as a string.
 *
 * @param tree
 * @returns the text of the tree
 */
export function toText(tree: Tree): string {
  let final = '';

  iterate(tree, (node) => {
    if (!_shouldSkipNode(node)) final += node.value;
  });

  return final;
}

export function applyEvent(tree: Tree, event: TreeEvent) {
  if ('insert' in event) {
    const { position, value } = event.insert;
    const identifier = new Identifier.Identifier(position);
    tree.insert({ identifier, value });
  }

  if ('delete' in event) {
    const { position } = event.delete;
    const identifier = new Identifier.Identifier(position);
    tree.delete(identifier);
  }
}
