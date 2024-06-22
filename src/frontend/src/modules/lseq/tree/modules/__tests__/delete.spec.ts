import { describe, expect, beforeEach, it } from '@jest/globals';

import { getNodeAtPosition, deleteValue, toText, Tree } from '../..';
import { TreeFactory } from '../../factory';

const text = 'All the blocks you could ever want';
const characters = text.split('');

describe('deleteValue', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should raise an error if the position is out of bounds', () => {
    expect(() => deleteValue(new Tree(), 0)).toThrowError(
      'There was an error finding the node to delete'
    );
    expect(() => deleteValue(tree, text.length)).toThrowError(
      'There was an error finding the node to delete'
    );
  });

  it('should remove the character at the given position', () => {
    const index = 10;
    const node = getNodeAtPosition(tree, index);
    const now = new Date();
    deleteValue(tree, index);
    const result = toText(tree);
    expect(result).toBe(text.slice(0, index) + text.slice(index + 1));
    expect(node?.deletedAt?.toISOString()).toBe(now.toISOString());
  });

  it('should return an event for the deletion', () => {
    const index = 10;
    const node = getNodeAtPosition(tree, index);
    if (!node) throw new Error('Expected to find node');
    const result = deleteValue(tree, index);
    expect(result).toEqual({
      delete: {
        position: node.identifier.value,
        transactionType: {
          delete: null,
        },
      },
    });
  });
});
