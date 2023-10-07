import { expect, test, describe } from '@jest/globals';
import * as Identifier from '../identifier';

describe('Identifier', () => {
  describe('Identifier', () => {
    test('can be instantiated', () => {
      const identifier = new Identifier.Identifier([1, 2, 3]);
      expect(identifier.value).toEqual([1, 2, 3]);
    });
  });

  describe('#subtract', () => {
    test('throws if identifier is empty', () => {
      const identifier = new Identifier.Identifier([]);
      expect(() => Identifier.subtract(identifier, 1)).toThrow('Identifier must not be empty');
    });

    test('throws if constant is greater than base at deepest level', () => {
      const identifier = new Identifier.Identifier([1, 2, 3]);
      expect(() => Identifier.subtract(identifier, 65)).toThrow(
        'Constant must be less than or equal to base at deepest level'
      );
    });

    test('can subtract a constant', () => {
      let identifier = new Identifier.Identifier([1, 2, 3]);
      let result = Identifier.subtract(identifier, 1);
      expect(result.value).toEqual([1, 2, 2]);

      identifier = new Identifier.Identifier([1, 2, 3]);
      result = Identifier.subtract(identifier, 4);
      expect(result.value).toEqual([1, 1, 63]);

      identifier = new Identifier.Identifier([1, 0, 0]);
      result = Identifier.subtract(identifier, 1);
      expect(result.value).toEqual([0, 31, 63]);
    });
  });
});
