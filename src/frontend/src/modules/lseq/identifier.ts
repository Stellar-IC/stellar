import * as Base from './base';
import * as Types from './types';

type NodeIndex = Types.NodeIndex;

/**
 * Identifier is a unique identifier for each element in the LSEQ tree.
 */
export class Identifier {
  value: NodeIndex[] | Uint16Array;

  constructor(value: NodeIndex[] | Uint16Array) {
    this.value = value;
  }
}

/**
 * Compare two identifiers.
 * @param identifierA
 * @param identifierB
 * @returns -1 if identifierA is less than identifierB, 0 if they are equal,
 *           1 if identifierA is greater than identifierB
 */
export function compare(
  identifierA: Identifier,
  identifierB: Identifier
): -1 | 0 | 1 {
  const identifierALength = identifierA.value.length;
  const identifierBLength = identifierB.value.length;

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
  const shorterNodeLength =
    (isNode1LongestNode ? identifierBLength : identifierALength) - 1;

  for (let i = 0; i <= shorterNodeLength; i += 1) {
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

export function equal(
  identifierA: Identifier,
  identifierB: Identifier
): boolean {
  const idValueA = identifierA.value;
  const idValueB = identifierB.value;

  if (idValueA.length !== idValueB.length) {
    return false;
  }

  for (let i = 0; i < idValueA.length; i += 1) {
    if (idValueA[i] !== idValueB[i]) {
      return false;
    }
  }

  return true;
}

export function subtract(
  identifier: Identifier,
  constant: NodeIndex
): Identifier {
  const identifierValue = identifier.value;
  const identifierLength = identifier.value.length;

  if (identifierLength === 0) {
    throw new Error('Identifier must not be empty');
  }

  if (constant > Base.at(identifierLength - 1)) {
    throw new Error(
      'Constant must be less than or equal to base at deepest level'
    );
  }

  if (identifierLength === 1) {
    if (identifierValue[0] < constant) throw new Error('Out of bounds');

    return new Identifier([identifierValue[0] - constant]);
  }

  const updatedIntervalValue: NodeIndex[] = [];
  let borrowed = false;
  let tempConstant = constant;

  for (let i = identifierLength - 1; i >= 0; i -= 1) {
    let valueAtIndex = identifierValue[i];
    if (borrowed) {
      valueAtIndex -= 1;
      borrowed = false; // Reset borrowed flag
    }
    if (valueAtIndex < tempConstant) {
      const base = Base.at(i);
      valueAtIndex += base; // Borrow from higher level
      borrowed = true;
    }
    const diff = valueAtIndex - tempConstant;
    if (diff < 0) throw new Error('Out of bounds');
    updatedIntervalValue.unshift(diff);
    tempConstant = 0;

    continue;
  }

  return new Identifier(updatedIntervalValue);
}
