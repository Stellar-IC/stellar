import * as Node from '../node';
import { AllocationStrategy, NodeBoundary } from '../types';

import * as Tree from '.';

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
        const position = Tree.size(tree);
        Tree.insertValue(tree, position, value);
      });
    }

    return tree;
  },
};
