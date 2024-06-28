import { END_NODE_ID, START_NODE_ID } from '../../constants';
import * as Identifier from '../../identifier';
import * as Interval from '../../interval';
import * as Node from '../../node';
import { NodeIndex, TreeEvent } from '../../types';
import { getRandomNumberBetween } from '../../utils';
import { Tree } from '../Tree';

import {
  findNextNode,
  getNodeAtPosition,
  getNodeAtPositionFromEnd,
} from './get';
import { size } from './size';

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
 */
function _buildNodesForFrontInsert(
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
 * @deprecated use insertValue or deleteValue instead
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
 */
function _buildNodeForMiddleInsert(
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
function _insertAtStart(tree: Tree, value: string) {
  const { node, nodeToDelete, replacementNode } = _buildNodesForFrontInsert(
    tree,
    value
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
  const node = _buildNodeForMiddleInsert(tree, character, position);
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
export function insertValue(
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
    const result = _insertAtStart(tree, character);
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

export function buildInsertEvents(
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
    const nodes = _buildNodesForFrontInsert(tree, character);
    const { node, nodeToDelete, replacementNode } = nodes;
    const events: TreeEvent[] = [_createInsertEvent(node)];
    if (nodeToDelete) events.push(_createDeleteEvent(nodeToDelete));
    if (replacementNode) events.push(_createInsertEvent(replacementNode));
    return events;
  }

  if (isAtEnd) {
    const node = buildNodeForEndInsert(tree, character);
    const events = [_createInsertEvent(node)];
    return events;
  }

  const node = _buildNodeForMiddleInsert(tree, character, position);
  const events = [_createInsertEvent(node)];

  return events;
}
