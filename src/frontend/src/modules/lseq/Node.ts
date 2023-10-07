import { END_NODE_ID, START_NODE_ID } from './constants';
import * as Identifier from './identifier';
import * as Interval from './interval';
import * as Types from './types';

type NodeBase = Types.NodeBase;
type NodeIndex = Types.NodeIndex;
type NodeDepth = Types.NodeDepth;

export class Node {
  identifier: Identifier.Identifier;
  value: string;
  children: Map<NodeIndex, Node>;
  base: NodeBase;
  deletedAt: Date | null;

  constructor(identifier: Identifier.Identifier, value: string) {
    this.identifier = identifier;
    this.value = value;
    this.children = new Map<NodeIndex, Node>();
    this.base = base(identifier.length);
    this.deletedAt = null;
  }

  delete() {
    this.deletedAt = new Date();
  }
}

export function isRootNode(node: Node) {
  return node.identifier.length === 0;
}

export function isEdgeNode(node: Node) {
  return (
    node.identifier.length === 1 &&
    (node.identifier.value[0] === START_NODE_ID.value[0] ||
      node.identifier.value[0] === END_NODE_ID.value[0])
  );
}

export function hasChildren(node: Node, options: { shouldSkipDeleted?: boolean } = {}): boolean {
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

export function equal(node1: Node, node2: Node): boolean {
  return (
    node1.value === node2.value &&
    JSON.stringify(node1.identifier) === JSON.stringify(node2.identifier)
  );
}

/**
 * Get the base for a given node depth.
 *
 * @param depth The depth of the node.
 * @return The base for the given node depth.
 */
export function base(depth: NodeDepth): NodeBase {
  return 2 ** (4 + depth);
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

  while (_isValidInterval(interval) == false && i < maxLoopCount) {
    depth += 1;
    nodeAPrefix = prefix(nodeAIdentifier, depth);
    nodeBPrefix = prefix(nodeBIdentifier, depth);
    interval = Interval.between(nodeAPrefix, nodeBPrefix);
    i++;

    if (i == maxLoopCount) throw new Error('Unable to determine depth for node identifier');
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
export function prefix(identifier: Identifier.Identifier, depth: NodeDepth): Identifier.Identifier {
  const finalValue = [];

  for (let i = 0; i < depth; i++) {
    if (i < identifier.length) {
      finalValue.push(identifier.value[i]);
    } else {
      finalValue.push(0);
    }
  }

  return new Identifier.Identifier(finalValue);
}

function _isValidInterval(interval: Interval.Interval): boolean {
  const intervalValue = interval.value;
  if (intervalValue.length == 0) {
    return false;
  }

  if (interval.isAllZeros()) {
    return false;
  }

  for (let i = 0; i < intervalValue.length; i++) {
    if (intervalValue[i] < 1) {
      continue;
    }
    return true;
  }

  return false;
}
