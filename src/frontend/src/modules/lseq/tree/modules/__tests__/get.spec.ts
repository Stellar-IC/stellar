import { describe, expect, beforeEach, it } from '@jest/globals';

import {
  findNextNode,
  findPreviousNode,
  getNodeAtPosition,
  getNodeAtPositionFromEnd,
  toArray,
  toText,
  Tree,
} from '../..';
import { END_NODE_ID } from '../../../constants';
import { TreeFactory } from '../../factory';

const text = 'All the blocks you could ever want';
const characters = text.split('');

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

describe('findPreviousNode', () => {
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
