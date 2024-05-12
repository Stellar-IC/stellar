import { describe, expect, beforeEach, it } from '@jest/globals';

import {
  clone,
  findNextNode,
  findPreviousNode,
  getNodeAtPosition,
  getNodeAtPositionFromEnd,
  insertCharacter,
  iterate,
  removeCharacter,
  toArray,
  toText,
  Tree,
} from '..';
import { TreeFactory } from '../../__tests__/factories';
import { END_NODE_ID } from '../../constants';

const text =
  "Nested numbered block don't show the right numbers and shift+tab doesn't work. Same for bulleted blocks";
const characters = text.split('');

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

describe('findNextNode', () => {
  let tree: Tree;

  it('should return the next node', () => {
    tree = TreeFactory.create({ values: characters });
    const treeSize = tree.size();
    let node = tree.rootNode;

    for (let i = 0; i < treeSize; i += 1) {
      const next = findNextNode(tree, node.identifier);
      if (!next) throw new Error('Expected to find next node');
      node = next;
      if (i === 0) continue; // skip the start node
      expect(node?.value).toBe(characters[i - 1]);
    }
  });
});

describe.only('findPreviousNode', () => {
  let tree: Tree;

  it('should return the previous node', () => {
    tree = TreeFactory.create({ values: characters });
    const treeSize = tree.size();
    let node = tree.get(END_NODE_ID);
    if (!node) throw new Error('Expected to find end node');

    for (let i = 0; i < treeSize; i += 1) {
      const previous = findPreviousNode(tree, node.identifier);
      if (!previous) throw new Error('Expected to find previous node');
      node = previous;
      expect(node?.value).toBe(characters[characters.length - 1 - i]);
    }
  });
});

describe('getNodeAtPosition', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: ['1', '2', '3'] });
  });

  it('should return null if the tree is empty', () => {
    const emptyTree = new Tree();
    const result = getNodeAtPosition(emptyTree, 0);
    expect(result).toBeNull();
  });

  it('should return the correct node', () => {
    let result = getNodeAtPosition(tree, 0);
    expect(result?.value).toBe('1');

    result = getNodeAtPosition(tree, 1);
    expect(result?.value).toBe('2');

    result = getNodeAtPosition(tree, 2);
    expect(result?.value).toBe('3');
  });

  it('should skip deleted nodes if shouldSkipDeleted is true', () => {
    const options = { shouldSkipDeleted: true };
    let result = getNodeAtPosition(tree, 0, options);
    if (!result) throw new Error('result is null');

    expect(result.value).toBe('1');

    tree.delete(result.identifier);
    result = getNodeAtPosition(tree, 0, options);
    expect(result?.value).toBe('2');

    result = getNodeAtPosition(tree, 0);
    expect(result?.value).toBe('2');
  });

  it('should not skip deleted nodes if shouldSkipDeleted is false', () => {
    const options = { shouldSkipDeleted: false };
    let result = getNodeAtPosition(tree, 0, options);
    if (!result) throw new Error('result is null');

    expect(result.value).toBe('1');

    tree.delete(result.identifier);
    result = getNodeAtPosition(tree, 0, options);
    expect(result?.value).toBe('1');
  });
});

describe('getNodeAtPositionFromEnd', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: ['1', '2', '3'] });
  });

  it('should return null if the tree is empty', () => {
    const emptyTree = new Tree();
    const result = getNodeAtPositionFromEnd(emptyTree, 0);
    expect(result).toBeNull();
  });

  it('should return the correct node', () => {
    let result = getNodeAtPositionFromEnd(tree, 0);
    expect(result?.value).toBe('3');

    result = getNodeAtPositionFromEnd(tree, 1);
    expect(result?.value).toBe('2');

    result = getNodeAtPositionFromEnd(tree, 2);
    expect(result?.value).toBe('1');
  });

  it('should skip deleted nodes if shouldSkipDeleted is true', () => {
    const options = { shouldSkipDeleted: true };
    let result = getNodeAtPositionFromEnd(tree, 0, options);
    if (!result) throw new Error('result is null');

    expect(result.value).toBe('3');

    tree.delete(result.identifier);
    result = getNodeAtPositionFromEnd(tree, 0, options);
    expect(result?.value).toBe('2');

    result = getNodeAtPositionFromEnd(tree, 0);
    expect(result?.value).toBe('2');
  });

  it('should not skip deleted nodes if shouldSkipDeleted is false', () => {
    const options = { shouldSkipDeleted: false };
    let result = getNodeAtPositionFromEnd(tree, 0, options);
    if (!result) throw new Error('result is null');

    expect(result.value).toBe('3');

    tree.delete(result.identifier);
    result = getNodeAtPositionFromEnd(tree, 0, options);
    expect(result?.value).toBe('3');
  });
});

describe('insertCharacter', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should insert a character at the given position', () => {
    const treeSize = tree.size();

    for (let i = 0; i < treeSize; i += 1) {
      const index = i;
      const character = 'HELLO WORLD';
      insertCharacter(tree, index, character);
      const result = toText(tree);
      const expected = text.slice(0, index) + character + text.slice(index);
      expect(result).toBe(expected);
      tree = TreeFactory.create({ values: characters });
    }
  });

  it('should return an event for the insertion', () => {
    const index = 10;
    const character = 'x';
    const result = insertCharacter(tree, index, character);

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

describe('removeCharacter', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should raise an error if the position is out of bounds', () => {
    expect(() => removeCharacter(new Tree(), 0)).toThrowError(
      'There was an error finding the node to delete'
    );
    expect(() => removeCharacter(tree, text.length)).toThrowError(
      'There was an error finding the node to delete'
    );
  });

  it('should remove the character at the given position', () => {
    const index = 10;
    const node = getNodeAtPosition(tree, index);
    const now = new Date();
    removeCharacter(tree, index);
    const result = toText(tree);
    expect(result).toBe(text.slice(0, index) + text.slice(index + 1));
    expect(node?.deletedAt?.toISOString()).toBe(now.toISOString());
  });

  it('should return an event for the deletion', () => {
    const index = 10;
    const node = getNodeAtPosition(tree, index);
    if (!node) throw new Error('Expected to find node');
    const result = removeCharacter(tree, index);
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

describe('toText', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should return the text', () => {
    const result = toText(tree);
    expect(result).toBe(text);
  });

  it('should return the text, excluding deleted nodes', () => {
    const node = getNodeAtPosition(tree, 0);
    if (!node) throw new Error('Expected to find node');
    tree.delete(node.identifier);
    const result = toText(tree);
    expect(result).toBe(text.slice(1));
  });
});

describe('toArray', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = TreeFactory.create({ values: characters });
  });

  it('should return the text as an array', () => {
    const result = toArray(tree);
    expect(result).toEqual(text.split(''));
  });

  it('should return the text as an array, excluding deleted nodes', () => {
    const node = getNodeAtPosition(tree, 0);
    if (!node) throw new Error('Expected to find node');
    tree.delete(node.identifier);
    const result = toArray(tree);
    expect(result).toEqual(text.slice(1).split(''));
  });
});
