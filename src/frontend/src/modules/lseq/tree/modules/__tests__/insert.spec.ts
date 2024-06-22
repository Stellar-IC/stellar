import { describe, expect, beforeEach, it } from '@jest/globals';

import { Tree } from '../../Tree';
import { TreeFactory } from '../../factory';
import { toText } from '../get';
import { insertValue } from '../insert';

const text = 'All the blocks you could ever want';
const characters = text.split('');

describe('insertValue', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should insert a character at the given position', () => {
    const treeSize = tree.size();

    for (let i = 0; i < treeSize; i += 1) {
      const index = i;
      const character = 'HELLO WORLD';
      insertValue(tree, index, character);
      const result = toText(tree);
      const expected = text.slice(0, index) + character + text.slice(index);
      expect(result).toBe(expected);
      tree = TreeFactory.create({ values: characters });
    }
  });

  it('should return an event for the insertion', () => {
    const index = 10;
    const character = 'x';
    const result = insertValue(tree, index, character);

    expect(result).toEqual([
      {
        insert: {
          position: expect.any(Array),
          value: character,
          transactionType: {
            insert: null,
          },
        },
      },
    ]);
  });
});
