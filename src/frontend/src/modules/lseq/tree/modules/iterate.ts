import { Stack } from 'js-sdsl';

import * as Node from '../../node';
import { Tree } from '../Tree';

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
