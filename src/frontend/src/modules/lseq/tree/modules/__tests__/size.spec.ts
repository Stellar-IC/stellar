import { describe, expect, beforeEach, it } from '@jest/globals';

import { Tree } from '../../Tree';
import { TreeFactory } from '../../factory';
import { deleteValue } from '../delete';
import { size } from '../size';

const text = 'All the blocks you could ever want';
const characters = text.split('');

describe('size', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should return the number of non-deleted nodes in the tree', () => {
    expect(size(tree)).toBe(text.length);
    deleteValue(tree, 0);
    expect(size(tree)).toBe(text.length - 1);
  });
});
