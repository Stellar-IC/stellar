import { expect, test, describe } from '@jest/globals';

import { Identifier } from '../identifier';
import * as Interval from '../interval';

describe('Interval', () => {
  describe('Interval', () => {
    test('can be instantiated', () => {
      const interval = new Interval.Interval([10]);
      expect(interval.value).toEqual([10]);
    });
  });

  describe('between', () => {
    test('throws when identifiers are not of equal length', () => {
      expect(() => {
        Interval.between(new Identifier([1, 2, 3]), new Identifier([1, 2]));
      }).toThrow('Identifiers must be of equal length');
      expect(() => {
        Interval.between(new Identifier([1, 2, 3]), new Identifier([1, 2, 3]));
      }).not.toThrow();
    });

    test('throws when identifierA is greater than identifierA', () => {
      expect(() => {
        Interval.between(new Identifier([1, 2, 3]), new Identifier([1, 2, 2]));
      }).toThrow('Prefix A must be less than prefix B');
    });

    test('returns an interval with the right value', () => {
      let interval: Interval.Interval;

      interval = Interval.between(
        new Identifier([1, 2, 3]),
        new Identifier([1, 2, 3])
      );
      expect(interval.value).toEqual([0, 0, 0]);

      interval = Interval.between(
        new Identifier([1, 2, 3]),
        new Identifier([1, 2, 4])
      );
      expect(interval.value).toEqual([0, 0, 0]);

      interval = Interval.between(
        new Identifier([1, 2, 3]),
        new Identifier([1, 2, 5])
      );
      expect(interval.value).toEqual([0, 0, 1]);

      interval = Interval.between(new Identifier([1]), new Identifier([2]));
      expect(interval.value).toEqual([0]);

      interval = Interval.between(
        new Identifier([1, 0]),
        new Identifier([2, 0])
      );
      expect(interval.value).toEqual([0, 31]);

      // Note:
      // I ran into an out of order insert error attempting to insert between [14, 31] and [14, 31, 1]
      // In the example, the only acceptable insertion point is [14, 31, 0]. Instead, the algorithm
      // was returning [14, 31, 0, 2] as the insertion point. This caused an error because there is
      // no node at [14, 31, 0].
      interval = Interval.between(
        new Identifier([14, 31, 0, 0]),
        new Identifier([14, 31, 1, 0])
      );
      expect(interval.value).toEqual([0, 0, 0, 127]);

      interval = Interval.between(
        new Identifier([12, 0]),
        new Identifier([13, 0])
      );
      expect(interval.value).toEqual([0, 31]);
    });
  });

  describe('isAllZeros', () => {
    test('returns true when all values are zero', () => {
      const interval = new Interval.Interval([0, 0, 0]);
      expect(Interval.isAllZeros(interval)).toBe(true);
    });

    test('returns false when any value is not zero', () => {
      const interval = new Interval.Interval([0, 0, 1]);
      expect(Interval.isAllZeros(interval)).toBe(false);
    });
  });
});
