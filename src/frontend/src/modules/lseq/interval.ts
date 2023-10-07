import * as Types from './types';
import * as Base from './base';
import * as Identifier from './identifier';

type NodeIndex = Types.NodeIndex;

export class Interval {
  value: NodeIndex[] | Uint16Array;

  constructor(value: NodeIndex[] | Uint16Array) {
    this.value = value;
  }

  isAllZeros(): boolean {
    for (const x of this.value) {
      if (x != 0) return false;
    }
    return true;
  }
}

export function between(prefixA: Identifier.Identifier, prefixB: Identifier.Identifier): Interval {
  if (prefixA.length != prefixB.length) throw new Error('Prefixes must be of equal length');

  const updatedIntervalValue: NodeIndex[] = [];
  let borrowedAmount = 0;

  for (let i = prefixA.length - 1; i >= 0; i--) {
    const valueAtIndex = {
      a: prefixA.value[i],
      b: prefixB.value[i],
    };

    if (borrowedAmount < 0) throw new Error('Borrowed amount cannot be less than 0');

    // Handle borrowing
    if (borrowedAmount > 0) {
      valueAtIndex.b -= borrowedAmount;
      borrowedAmount = 0;

      calculateValueAtIndex(i, valueAtIndex, borrowedAmount, (newValue, borrowed) => {
        updatedIntervalValue.unshift(newValue);
        borrowedAmount = borrowed;
      });

      continue;
    }

    calculateValueAtIndex(i, valueAtIndex, borrowedAmount, (newValue, borrowed) => {
      updatedIntervalValue.unshift(newValue);
      borrowedAmount = borrowed;
    });
  }

  let final = new Interval(updatedIntervalValue);

  if (final.isAllZeros()) return final;

  final = new Interval(Identifier.subtract(new Identifier.Identifier(final.value), 1).value);

  return final;
}

function calculateValueAtIndex(
  index: number,
  valueAtIndex: { a: NodeIndex; b: NodeIndex },
  borrowedAmount: number,
  onSuccess: (newValue: number, borrowedAmount: number) => void
) {
  const base = Base.at(index);

  if (valueAtIndex.a > valueAtIndex.b && index == 0)
    throw new Error('Prefix A must be less than prefix B');

  if (valueAtIndex.a > valueAtIndex.b) {
    const amountToBorrow = 1;

    // Borrow from the next index
    valueAtIndex.b += base;
    borrowedAmount = amountToBorrow;
  }

  const newValue = valueAtIndex.b - valueAtIndex.a;
  if (newValue < 0) throw new Error('Out of bounds');

  onSuccess(newValue, borrowedAmount);
}
