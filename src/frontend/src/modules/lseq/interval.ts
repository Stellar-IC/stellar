import * as Base from './base';
import * as Identifier from './identifier';
import * as Types from './types';

type NodeIndex = Types.NodeIndex;

export class Interval {
  value: NodeIndex[] | Uint16Array;

  constructor(value: NodeIndex[] | Uint16Array) {
    this.value = value;
  }
}

function _calculateDifference(
  index: number,
  valueB: NodeIndex,
  valueA: NodeIndex
): [diff: number, borrowed: boolean] {
  const base = Base.at(index);
  let _valueB = valueB;
  let borrowed = false;

  if (valueA > _valueB && index === 0) {
    throw new Error('Prefix A must be less than prefix B');
  }

  if (valueA > _valueB) {
    _valueB += base;
    borrowed = true;
  }

  const diff = _valueB - valueA;
  if (diff < 0) throw new Error('Out of bounds');

  return [diff, borrowed];
}

export function between(
  identifierA: Identifier.Identifier,
  identifierB: Identifier.Identifier
): Interval {
  const lengthA = identifierA.value.length;
  const lengthB = identifierB.value.length;

  if (lengthA !== lengthB) {
    throw new Error('Identifiers must be of equal length');
  }

  const updatedIntervalValue: NodeIndex[] = [];
  let borrowedAmount = 0;

  // Calculate the interval by comparing the identifiers at each index,
  // starting from the rightmost index.
  for (let i = lengthA - 1; i >= 0; i -= 1) {
    const valueA = identifierA.value[i];
    let valueB = identifierB.value[i];
    if (borrowedAmount < 0 || borrowedAmount > 1) {
      throw new Error('Borrowed amount should be either 0 or 1');
    }
    // Handle borrowing
    if (borrowedAmount > 0) {
      valueB -= borrowedAmount;
      borrowedAmount = 0;
    }
    const [diff, borrowed] = _calculateDifference(i, valueB, valueA);
    updatedIntervalValue.unshift(diff);

    if (borrowed) borrowedAmount = 1;
  }

  let final = new Interval(updatedIntervalValue);
  if (isAllZeros(final)) return final;

  // Subtract 1 from the final interval
  final = new Interval(
    Identifier.subtract(new Identifier.Identifier(final.value), 1).value
  );

  return final;
}

export function isAllZeros(interval: Interval): boolean {
  for (const x of interval.value) if (x !== 0) return false;

  return true;
}
