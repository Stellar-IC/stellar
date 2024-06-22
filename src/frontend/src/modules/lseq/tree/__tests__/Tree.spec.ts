import { describe, test, expect } from '@jest/globals';

import * as Tree from '..';
import { DEFAULT_BOUNDARY } from '../../constants';
import * as Identifier from '../../identifier';
import * as Types from '../../types';
import { base } from '../../utils';

describe('Tree', () => {
  describe('Tree', () => {
    test('can be instantiated', () => {
      const tree = new Tree.Tree();

      expect(tree.boundary).toEqual(DEFAULT_BOUNDARY);
      expect(tree.allocationStrategies.size).toEqual(0);
      expect(tree.rootNode.identifier.value).toEqual([]);
      expect(tree.rootNode.value).toEqual('');
      expect(tree.rootNode.base).toEqual(16);
      expect(tree.rootNode.children.size).toEqual(2);

      const startNode = tree.rootNode.children.get(0);
      expect(startNode?.identifier.value).toEqual([0]);
      expect(startNode?.value).toEqual('');
      expect(startNode?.base).toEqual(base(1));
      expect(startNode?.children.size).toEqual(0);

      const endNode = tree.rootNode.children.get(15);
      expect(endNode?.identifier.value).toEqual([15]);
      expect(endNode?.value).toEqual('');
      expect(endNode?.base).toEqual(base(1));
      expect(endNode?.children.size).toEqual(0);
    });
  });

  describe('getNodeAtPosition', () => {
    test('returns the correct node', () => {
      const tree = new Tree.Tree();
      const nodes = [
        { identifier: [1], value: 'H' },
        { identifier: [2], value: 'e' },
        { identifier: [2, 5], value: 'l' },
        { identifier: [2, 9], value: 'l' },
        { identifier: [2, 13], value: 'o' },
        { identifier: [3], value: ' ' },
        { identifier: [4], value: 'W' },
        { identifier: [5], value: 'o' },
        { identifier: [5, 0], value: 'r' },
        { identifier: [5, 31], value: 'l' },
        { identifier: [5, 31, 63], value: 'd' },
      ];

      for (let i = 0; i < nodes.length; i += 1) {
        const nodeToInsert = nodes[i];
        tree.insert({
          identifier: new Identifier.Identifier(nodeToInsert.identifier),
          value: nodeToInsert.value,
        });

        const insertedNode = Tree.getNodeAtPosition(tree, i);
        if (!insertedNode) throw new Error('Node not found');

        const { children, ...node } = insertedNode;

        expect(node).toMatchObject({
          deletedAt: null,
          identifier: { value: nodeToInsert.identifier },
          value: nodeToInsert.value,
          base: base(nodeToInsert.identifier.length),
        });
        expect(node.value).toEqual(nodeToInsert.value);
        expect(node.base).toEqual(base(node.identifier.value.length));
        expect(children.size).toEqual(0);
      }
    });

    test('returns the correct node after a deletion', () => {
      const tree = new Tree.Tree();
      const nodes = [
        { identifier: [1], value: 'H' },
        { identifier: [2], value: 'e' },
        { identifier: [2, 5], value: 'l' },
        { identifier: [2, 9], value: 'l' },
        { identifier: [2, 13], value: 'o' },
        { identifier: [3], value: ' ' },
        { identifier: [4], value: 'W' },
        { identifier: [5], value: 'o' },
        { identifier: [5, 0], value: 'r' },
        { identifier: [5, 31], value: 'l' },
        { identifier: [5, 31, 63], value: 'd' },
      ].map(({ identifier, value }) => ({
        identifier: new Identifier.Identifier(identifier),
        value,
      }));

      tree.insertMany(nodes);
      tree.delete(new Identifier.Identifier([1]));
      tree.delete(new Identifier.Identifier([2]));
      tree.delete(new Identifier.Identifier([5]));
      tree.delete(new Identifier.Identifier([5, 31]));
      tree.delete(new Identifier.Identifier([5, 31, 63]));

      function assertCorrectNodeAtPosition(
        position: number,
        expectedNode: {
          identifier: Identifier.Identifier;
          value: Types.NodeValue;
        }
      ) {
        const node = Tree.getNodeAtPosition(tree, position);

        if (!node) throw new Error('Node not found');

        expect(node).toMatchObject({
          identifier: expectedNode.identifier,
          value: expectedNode.value,
          base: base(expectedNode.identifier.value.length),
          deletedAt: null,
        });
      }

      assertCorrectNodeAtPosition(0, nodes[2]);
      assertCorrectNodeAtPosition(1, nodes[3]);
      assertCorrectNodeAtPosition(2, nodes[4]);
      assertCorrectNodeAtPosition(3, nodes[5]);
      assertCorrectNodeAtPosition(4, nodes[6]);
      assertCorrectNodeAtPosition(5, nodes[8]);

      const node = Tree.getNodeAtPosition(tree, 9);
      expect(node).toEqual(null);
    });
  });

  describe('size', () => {
    test('returns the correct size', () => {
      const tree = new Tree.Tree();
      const nodes = [
        { identifier: [1], value: 'H' },
        { identifier: [2], value: 'e' },
        { identifier: [2, 5], value: 'l' },
        { identifier: [2, 9], value: 'l' },
        { identifier: [2, 13], value: 'o' },
        { identifier: [3], value: ' ' },
        { identifier: [4], value: 'W' },
        { identifier: [5], value: 'o' },
        { identifier: [5, 0], value: 'r' },
        { identifier: [5, 31], value: 'l' },
        { identifier: [5, 31, 63], value: 'd' },
      ];

      for (let i = 0; i < nodes.length; i += 1) {
        const nodeToInsert = nodes[i];
        tree.insert({
          identifier: new Identifier.Identifier(nodeToInsert.identifier),
          value: nodeToInsert.value,
        });
        expect(tree.size()).toEqual(i + 1);
      }
    });

    test('returns the correct size after a deletion', () => {
      const tree = new Tree.Tree();
      const nodes = [
        { identifier: [1], value: 'H' },
        { identifier: [2], value: 'e' },
        { identifier: [2, 5], value: 'l' },
        { identifier: [2, 9], value: 'l' },
        { identifier: [2, 13], value: 'o' },
        { identifier: [3], value: ' ' },
        { identifier: [4], value: 'W' },
        { identifier: [5], value: 'o' },
        { identifier: [5, 0], value: 'r' },
        { identifier: [5, 31], value: 'l' },
        { identifier: [5, 31, 63], value: 'd' },
      ];
      tree.insertMany(
        nodes.map((node) => ({
          ...node,
          identifier: new Identifier.Identifier(node.identifier),
        }))
      );

      expect(tree.size()).toEqual(11);
      tree.delete(new Identifier.Identifier([1]));
      expect(tree.size()).toEqual(10);
    });
  });
});
