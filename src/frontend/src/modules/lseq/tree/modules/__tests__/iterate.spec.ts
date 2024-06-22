import { describe, expect, beforeEach, it } from '@jest/globals';

import { Tree } from '../../Tree';
import { TreeFactory } from '../../factory';
import { iterate } from '../iterate';

const text = 'All the blocks you could ever want';
const characters = text.split('');

describe('iterate', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should iterate over the tree', () => {
    let result = '';
    iterate(tree, (node) => {
      result += node.value;
    });
    expect(result).toBe(text);
  });
});
