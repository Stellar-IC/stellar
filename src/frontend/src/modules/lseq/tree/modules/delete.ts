import { TreeEvent } from '../../types';
import { Tree } from '../Tree';

import { getNodeAtPosition } from './get';

/**
 * Remove a character at a given position in the tree.
 *
 * @param tree the tree to remove the character from
 * @param position the position to remove the character
 * @returns event that occurred during the remove or void if the position is at the start
 * @throws {Error} if there was an error finding the node before the cursor
 */
export function deleteValue(tree: Tree, position: number): TreeEvent {
  const nodeToDelete = getNodeAtPosition(tree, position);

  if (!nodeToDelete) {
    throw new Error('There was an error finding the node to delete');
  }

  tree.delete(nodeToDelete.identifier);

  return buildDeleteEvent(tree, position);
}

export function buildDeleteEvent(tree: Tree, position: number): TreeEvent {
  const nodeToDelete = getNodeAtPosition(tree, position);

  if (!nodeToDelete) {
    throw new Error('There was an error finding the node to delete');
  }

  return {
    delete: {
      position: nodeToDelete.identifier.value,
      transactionType: {
        delete: null,
      },
    },
  };
}
