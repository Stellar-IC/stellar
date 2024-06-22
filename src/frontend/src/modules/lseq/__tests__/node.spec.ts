import { expect, test, describe } from '@jest/globals';

import { END_NODE_ID, START_NODE_ID } from '../constants';
import { Identifier } from '../identifier';
import * as Node from '../node';

describe('Node', () => {
  describe('Node', () => {
    test('can be instantiated', () => {
      const identifier = new Identifier([1, 2, 3]);
      const node = new Node.Node(identifier, 'Hello World');
      expect(node.identifier.value).toEqual([1, 2, 3]);
      expect(node.value).toEqual('Hello World');
      expect(node.children.size).toEqual(0);
      expect(node.base).toEqual(128);
      expect(node.deletedAt).toBeNull();
    });

    describe('delete', () => {
      test('can be deleted', () => {
        const identifier = new Identifier([1, 2, 3]);
        const node = new Node.Node(identifier, 'Hello World');
        node.delete();
        expect(node.deletedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('isRootNode', () => {
    test('returns true if node is root node', () => {
      const identifier = new Identifier([]);
      const node = new Node.Node(identifier, '');
      expect(Node.isRootNode(node)).toBe(true);
    });

    test('returns false if node is not root node', () => {
      const identifier = new Identifier([1]);
      const node = new Node.Node(identifier, '');
      expect(Node.isRootNode(node)).toBe(false);
    });
  });

  describe('isEdgeNode', () => {
    test('returns true if node is edge node', () => {
      const startNode = new Node.Node(START_NODE_ID, '');
      expect(Node.isEdgeNode(startNode)).toBe(true);

      const endNode = new Node.Node(END_NODE_ID, '');
      expect(Node.isEdgeNode(endNode)).toBe(true);
    });

    test('returns false if node is not edge node', () => {
      const identifier = new Identifier([1]);
      const node = new Node.Node(identifier, '');
      expect(Node.isEdgeNode(node)).toBe(false);
    });
  });
});
