import { describe, expect, beforeEach, it } from '@jest/globals';

import { clone, toText, Tree } from '../..';
import { TreeFactory } from '../../factory';

describe('clone', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: ['1', '2', '3'] });
  });

  it('should create an copy of the tree', () => {
    const copy = clone(tree);
    expect(copy).not.toBe(tree);
    expect(copy.boundary).toEqual(tree.boundary);
    // TODO: allocationStategies and rootNode should have different references
    expect(copy.allocationStrategies).toEqual(tree.allocationStrategies);
    expect(copy.rootNode).toEqual(tree.rootNode);
    expect(toText(copy)).toEqual(toText(tree));
  });
});
