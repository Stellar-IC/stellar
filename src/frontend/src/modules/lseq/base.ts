import * as Types from './types';

type NodeBase = Types.NodeBase;
type NodeDepth = Types.NodeDepth;

export function at(depth: NodeDepth): NodeBase {
  return 2 ** (4 + depth);
}
