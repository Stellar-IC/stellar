export type NodeIdentifier = number[] | Uint16Array;
export type NodeIndex = number;
export type NodeBase = number;
export type NodeDepth = number;
export type NodeValue = string;
export type NodeBoundary = number;

export type Node = {
  base: NodeBase;
  identifier: NodeIdentifier;
  value: NodeValue;
  children: Map<number, Node>;
  deletedAt?: Date;
};

export type ShareableNode = {
  base: NodeBase;
  identifier: NodeIdentifier;
  value: NodeValue;
  children: [[NodeIndex, ShareableNode]];
};

export type AllocationStrategy =
  | { boundaryPlus: null }
  | { boundaryMinus: null };
