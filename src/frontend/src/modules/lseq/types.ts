export type NodeIdentifier = number[] | Uint16Array;
export type NodeIndex = number;
export type NodeBase = number;
export type NodeDepth = number;
export type NodeValue = string;
export type NodeBoundary = number;

export type AllocationStrategy =
  | { boundaryPlus: null }
  | { boundaryMinus: null };

export type TreeEvent =
  | {
      delete: {
        transactionType: { delete: null };
        position: NodeIdentifier;
      };
    }
  | {
      insert: {
        transactionType: { insert: null };
        value: NodeValue;
        position: NodeIdentifier;
      };
    };
