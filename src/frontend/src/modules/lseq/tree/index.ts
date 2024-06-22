import { Identifier } from '../identifier';
import { TreeEvent } from '../types';

import { Tree } from './Tree';

export * from './Tree';
export * from './modules/clone';
export * from './modules/delete';
export * from './modules/get';
export * from './modules/insert';
export * from './modules/iterate';
export * from './modules/size';

export function applyUpdate(tree: Tree, event: TreeEvent) {
  if ('insert' in event) {
    const { position, value } = event.insert;
    const identifier = new Identifier(position);
    tree.insert({ identifier, value });
  }

  if ('delete' in event) {
    const { position } = event.delete;
    const identifier = new Identifier(position);
    tree.delete(identifier);
  }
}
