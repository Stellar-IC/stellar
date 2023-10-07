import * as Base from './base';
import * as Types from './types';

type NodeIndex = Types.NodeIndex;

export class Identifier {
  value: NodeIndex[] | Uint16Array;

  constructor(value: NodeIndex[] | Uint16Array) {
    this.value = value;
  }

  get length() {
    return this.value.length;
  }
}

export function compare(identifierA: Identifier, identifierB: Identifier): -1 | 0 | 1 {
  const identifierALength = identifierA.length;
  const identifierBLength = identifierB.length;

  if (identifierALength === 0 && identifierBLength === 0) {
    if (identifierALength === identifierBLength) {
      return 0;
    }
    if (identifierALength > identifierBLength) {
      return 1;
    }
    return -1;
  }

  const isNode1LongestNode = identifierALength > identifierBLength;
  const areNodesEqualLength = identifierALength === identifierBLength;
  const shorterNodeLength = (isNode1LongestNode ? identifierBLength : identifierALength) - 1;

  for (let i = 0; i <= shorterNodeLength; i++) {
    const identifierAPart = identifierA.value[i];
    const identifierBPart = identifierB.value[i];

    if (identifierAPart === identifierBPart) {
      continue;
    } else if (identifierAPart > identifierBPart) {
      return 1;
    } else {
      return -1;
    }
  }

  if (isNode1LongestNode) {
    return 1;
  }

  if (areNodesEqualLength) {
    return 0;
  }

  return -1;
}

export function subtract(identifier: Identifier, constant: NodeIndex): Identifier {
  const identifierValue = identifier.value;
  const identifierLength = identifier.length;

  if (identifierLength == 0) {
    throw new Error('Identifier must not be empty');
  }

  if (constant > Base.at(identifierLength - 1)) {
    throw new Error('Constant must be less than or equal to base at deepest level');
  }

  if (identifierLength == 1) {
    if (identifierValue[0] < constant) throw new Error('Out of bounds');

    return new Identifier([identifierValue[0] - constant]);
  }

  const updatedIntervalValue: NodeIndex[] = [];
  let borrowedAmount = 0;
  let tempConstant = constant;

  for (let i = identifierLength - 1; i >= 0; i--) {
    let valueAtIndex = identifierValue[i];
    const base = Base.at(i);

    if (borrowedAmount < 0) throw new Error('Borrowed amount cannot be less than 0');

    // Handle borrowing
    if (borrowedAmount > 0) {
      valueAtIndex -= borrowedAmount;
      borrowedAmount = 0;

      if (tempConstant > valueAtIndex) {
        const amountToBorrow = 1;

        // Borrow from the next index
        valueAtIndex = identifierValue[i] - 1 + base;
        borrowedAmount = amountToBorrow;
      }

      const newValue = valueAtIndex - tempConstant;
      if (newValue < 0) throw new Error('Out of bounds');

      updatedIntervalValue.unshift(newValue);
      tempConstant = 0;

      continue;
    }

    if (tempConstant > valueAtIndex) {
      const amountToBorrow = 1;

      // Borrow from the next index
      valueAtIndex = identifierValue[i] + base;
      borrowedAmount = amountToBorrow;
    }

    const newValue = valueAtIndex - tempConstant;
    if (newValue < 0) throw new Error('Out of bounds');

    updatedIntervalValue.unshift(newValue);
    tempConstant = 0;
  }

  return new Identifier(updatedIntervalValue);
}
