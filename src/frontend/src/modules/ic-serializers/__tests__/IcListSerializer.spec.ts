import { describe, expect } from 'vitest';

import { IcListSerializer } from '../IcListSerializer';
import { IcShareableList } from '../types';

describe('IcListSerializer', () => {
  it('should return an empty list when input is an empty list', () => {
    const serializer = new IcListSerializer();
    const result = serializer.serialize([], { fromShareable: (data) => data });
    expect(result).toEqual([]);
  });

  it('should serialize a list with one item', () => {
    const serializer = new IcListSerializer<number, string>();
    const result = serializer.serialize([[1, []]], {
      fromShareable: (data) => `${data}`,
    });
    expect(result).toEqual(['1']);
  });

  it('should serialize a list with multiple items', () => {
    const serializer = new IcListSerializer<number, string>();
    const result = serializer.serialize([[1, [[2, [[3, []]]]]]], {
      fromShareable: (data) => `${data}`,
    });
    expect(result).toEqual(['1', '2', '3']);
  });

  it('should stop serialization after 1000 items', () => {
    const MAX_NUMBER_OF_ITERATIONS = 1000;
    const numItemsToCreate = MAX_NUMBER_OF_ITERATIONS + 1;

    // Build the inputs and expected outputs
    // input will be in the shape: [[1, [[2, ...[[1000, []]]]]
    // expected will be in the shape: ['1', '2', ...'1000']
    let input: IcShareableList<number> = [[numItemsToCreate, []]];
    let expected: string[] = [];

    let i = numItemsToCreate;
    while (i > 1) {
      i -= 1;
      input = [[i, input]];
      if (i <= MAX_NUMBER_OF_ITERATIONS) {
        expected = [`${i}`, ...expected];
      }
    }

    const serializer = new IcListSerializer<number, string>();
    const result = serializer.serialize(input, {
      fromShareable: (data) => `${data}`,
    });

    expect(result).toEqual(expected);
  });
});
