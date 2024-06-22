import { END_NODE_ID } from '../../constants';
import * as Identifier from '../../identifier';
import * as Node from '../../node';
import { Tree } from '../Tree';

import { iterate } from './iterate';

function _shouldSkipNode(node: Node.Node, shouldSkipDeleted = true) {
  return (
    (shouldSkipDeleted && node.deletedAt !== null) ||
    Node.isEdgeNode(node) ||
    Node.isRootNode(node)
  );
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
