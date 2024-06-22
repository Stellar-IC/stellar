import * as Base from './base';
import { END_NODE_ID, START_NODE_ID } from './constants';
import * as Identifier from './identifier';
import * as Interval from './interval';
import * as Types from './types';

type NodeBase = Types.NodeBase;
type NodeIndex = Types.NodeIndex;
type NodeDepth = Types.NodeDepth;
type NodeValue = Types.NodeValue;

export class Node {
  readonly identifier: Identifier.Identifier;
  readonly value: NodeValue;
  children: Map<NodeIndex, Node>;
  readonly base: NodeBase;
  deletedAt: Date | null;

  constructor(identifier: Identifier.Identifier, value: NodeValue) {
    this.identifier = identifier;
    this.value = value;
    this.children = new Map<NodeIndex, Node>();
    this.base = Base.at(identifier.value.length);
    this.deletedAt = null;
  }

  delete() {
    this.deletedAt = new Date();
  }
}

/**
 * Checks if the given node is the root node.
 *
 * @param node
 * @returns
 */
export function isRootNode(node: Node) {
  return node.identifier.value.length === 0;
}

/**
 * Checks if the given node are the edge nodes.
 * These are the nodes at [0] and [15].
 *
 * @param node
 * @returns
 */
export function isEdgeNode(node: Node) {
  return (
    Identifier.equal(node.identifier, START_NODE_ID) ||
    Identifier.equal(node.identifier, END_NODE_ID)
  );
}

/**
 * Checks if the given node has children.
 *
 * @param node
 * @param options
 * @param options.shouldSkipDeleted If true, deleted nodes will be ignored.
 * @returns
 */
export function hasChildren(
  node: Node,
  options: { shouldSkipDeleted?: boolean } = {}
): boolean {
  const { shouldSkipDeleted = true } = options;

  if (isEdgeNode(node)) return false;

  for (const childNode of node.children.values()) {
    if (isEdgeNode(childNode)) continue;
    if (shouldSkipDeleted && childNode.deletedAt) continue;
    return true;
  }

  return false;
}

export function compare(nodeA: Node, nodeB: Node): -1 | 0 | 1 {
  return Identifier.compare(nodeA.identifier, nodeB.identifier);
}

export function equal(node1: Node | null, node2: Node | null): boolean {
  if (node1 && node2) {
    return (
      node1.value === node2.value &&
      JSON.stringify(node1.identifier) === JSON.stringify(node2.identifier)
    );
  }

  if (node1 && !node2) return false;
  if (!node1 && node2) return false;

  return true;
}

export function getShallowInsertDepth(
  nodeAIdentifier: Identifier.Identifier,
  nodeBIdentifier: Identifier.Identifier
): NodeDepth {
  const maxLoopCount = 20;
  let i = 0;
  let depth: NodeDepth = 0;
  let interval = new Interval.Interval([]);
  let nodeAPrefix = new Identifier.Identifier([]);
  let nodeBPrefix = new Identifier.Identifier([]);

  while (_isValidInterval(interval) === false && i < maxLoopCount) {
    depth += 1;
    nodeAPrefix = prefix(nodeAIdentifier, depth);
    nodeBPrefix = prefix(nodeBIdentifier, depth);
    interval = Interval.between(nodeAPrefix, nodeBPrefix);
    i += 1;

    if (i === maxLoopCount) {
      throw new Error('Unable to determine depth for node identifier');
    }
  }

  return depth;
}

/**
 * Calculate the prefix of a node identifier at a given depth
 *
 * @param nodeId The node identifier.
 * @param depth The depth to calculate the prefix at.
 * @return The prefix of the node identifier at the given depth.
 */
export function prefix(
  identifier: Identifier.Identifier,
  depth: NodeDepth
): Identifier.Identifier {
  const result = [];

  // Push the values of the identifier up to the depth.
  for (let i = 0; i < depth; i += 1) {
    if (i < identifier.value.length) {
      result.push(identifier.value[i]);
    } else {
      // If the identifier is shorter than the depth, pad with zeros.
      result.push(0);
    }
  }

  return new Identifier.Identifier(result);
}

function _isValidInterval(interval: Interval.Interval): boolean {
  const intervalValue = interval.value;
  if (intervalValue.length === 0) {
    return false;
  }

  if (Interval.isAllZeros(interval)) {
    return false;
  }

  for (let i = 0; i < intervalValue.length; i += 1) {
    if (intervalValue[i] < 1) {
      continue;
    }
    return true;
  }

  return false;
}
