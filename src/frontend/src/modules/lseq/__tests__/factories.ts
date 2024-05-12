import * as Node from '../Node';
import * as Tree from '../Tree';
import { AllocationStrategy, NodeBoundary } from '../types';

export type TreeFactoryOverrides = {
  allocationStrategies?: Map<number, AllocationStrategy>;
  boundary?: NodeBoundary;
  rootNode?: Node.Node;
};

export const TreeFactory = {
  create: (
    overrides: TreeFactoryOverrides & {
      // predefine the values to insert into the tree
      values?: string[];
    } = {}
  ) => {
    const { values, ...options } = overrides;

    const tree = new Tree.Tree(options);
    if (values) {
      values.forEach((value) => {
        tree.insert(Tree.buildNodeForEndInsert(tree, value));
      });
    }

    return tree;
  },
};
