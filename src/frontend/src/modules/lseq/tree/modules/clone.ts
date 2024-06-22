import * as Node from '../../node';
import { Tree } from '../Tree';

import { iterate } from './iterate';

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
