import { parse, stringify, v4 } from 'uuid';
import { describe } from 'vitest';

import { Block } from '@/types';

import { ShareableBlock } from '../../../../../declarations/workspace/workspace.did';
import { fromShareable, serializeBlock } from '../serializers';

const mockBlock: Omit<ShareableBlock, 'id'> = {
  uuid: parse(v4()),
  blockType: { page: null },
  content: {
    allocationStrategies: [],
    boundary: 10,
    rootNode: {
      identifier: [],
      value: '',
      children: [],
      base: 16,
      deletedAt: [],
    },
  },
  properties: {
    title: [
      {
        allocationStrategies: [],
        boundary: 10,
        rootNode: {
          identifier: [],
          value: '',
          children: [],
          base: 16,
          deletedAt: [],
        },
      },
    ],
    checked: [],
  },
  parent: [],
};

const expectedSerialized: Omit<Block, 'id'> = {
  content: expect.objectContaining({
    allocationStrategies: expect.objectContaining({}),
    boundary: 10,
    rootNode: expect.objectContaining({
      identifier: expect.objectContaining({ value: [], length: 0 }),
      base: 16,
      // TODO: figuere out how to test that this is serialized properly
      children: expect.objectContaining({}),
      deletedAt: null,
      value: '',
    }),
  }),
  properties: expect.objectContaining({
    title: expect.objectContaining({
      allocationStrategies: expect.objectContaining({}),
      boundary: 10,
      rootNode: expect.objectContaining({
        identifier: expect.objectContaining({ value: [], length: 0 }),
        base: 16,
        // TODO: figuere out how to test that this is serialized properly
        children: expect.objectContaining({}),
        deletedAt: null,
        value: '',
      }),
    }),
    checked: null,
  }),
  parent: null,
  uuid: stringify(mockBlock.uuid),
  blockType: { page: null },
};

describe('block', () => {
  describe('serializeBlock', () => {
    it('should work', () => {
      const expected: Omit<Block, 'id'> = expectedSerialized;
      const serialized = serializeBlock(mockBlock);
      expect(serialized).toEqual(expected);
    });
  });

  describe('fromShareable', () => {
    it('should work', () => {
      const result = fromShareable(mockBlock);
      const expected: Block = expectedSerialized;

      expect(result).toEqual(expected);
    });
  });

  describe.todo('fromLocalStorage');
  describe.todo('fromLocalStorageBulk');
  describe.todo('toLocalStorage');
  describe.todo('toLocalStorageBulk');
});
