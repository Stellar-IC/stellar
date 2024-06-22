import { NodeBase, NodeDepth } from './types';

/**
 * Get the base for a given node depth.
 *
 * @param depth The depth of the node.
 * @return The base for the given node depth.
 */
export function base(depth: NodeDepth): NodeBase {
  return 2 ** (4 + depth);
}

/**
 * Get a random number between min and max (inclusive of both).
 *
 * @param min
 * @param max
 * @returns the random number
 */
export function getRandomNumberBetween(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
