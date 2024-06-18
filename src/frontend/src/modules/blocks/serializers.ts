import { stringify } from 'uuid';

import { Node, Tree } from '@/modules/lseq';
import { DEFAULT_BOUNDARY } from '@/modules/lseq/constants';
import * as Identifier from '@/modules/lseq/identifier';
import { Block, LocalStorageBlock } from '@/types';

import {
  NodeBoundary,
  ShareableBlock,
  ShareableBlockText,
  ShareableNode,
} from '../../../../declarations/workspace/workspace.did';

export interface BlockText {
  rootNode: Node.Node;
  boundary: NodeBoundary;
}

function nodefromShareable(shareable: ShareableNode): Node.Node {
  const node = new Node.Node(
    new Identifier.Identifier(shareable.identifier),
    shareable.value
  );

  shareable.children.forEach(([index, childNode]) => {
    node.children.set(index, nodefromShareable(childNode));
  });

  node.base = shareable.base;
  node.deletedAt =
    shareable.deletedAt.length > 0
      ? new Date(Number(shareable.deletedAt[0]) / 1000000)
      : null;

  return node;
}

function treefromShareable(tree: ShareableBlockText): Tree.Tree {
  return new Tree.Tree({
    allocationStrategies: new Map(),
    boundary: tree.boundary,
    rootNode: nodefromShareable(tree.rootNode),
  });
}

export function serializeBlock(block: ShareableBlock): Block {
  const parent = block.parent.length > 0 ? block.parent[0] : null;
  const title =
    block.properties.title.length > 0 ? block.properties.title[0] : null;
  const defaultTitle = new Tree.Tree({
    rootNode: new Node.Node(new Identifier.Identifier(new Uint16Array()), ''),
    boundary: DEFAULT_BOUNDARY,
  });

  return {
    ...block,
    blockType: block.blockType,
    uuid: stringify(block.uuid),
    properties: {
      ...block.properties,
      title: title ? treefromShareable(title) : defaultTitle,
      checked:
        block.properties.checked.length > 0
          ? block.properties.checked[0]
          : null,
    },
    content: treefromShareable(block.content),
    parent: parent ? stringify(parent) : null,
  };
}

export function fromShareable(block: ShareableBlock): Block {
  return serializeBlock(block);
}

export function fromLocalStorage(block: LocalStorageBlock): Block {
  const rootNode = new Node.Node(
    block.properties.title.rootNode.identifier,
    block.properties.title.rootNode.value
  );

  rootNode.children = new Map<number, Node.Node>(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Object.entries(block.properties.title.rootNode.children)
  );

  return {
    ...block,
    content: Tree.clone(block.content),
    properties: {
      ...block.properties,
      title: Tree.clone(block.properties.title),
    },
  };
}

export function fromLocalStorageBulk(
  blocks: Record<string, LocalStorageBlock>
): Record<string, Block> {
  const prepared: Record<string, Block> = {};

  Object.keys(blocks).forEach((externalId) => {
    const block = blocks[externalId];
    if (block) prepared[externalId] = fromLocalStorage(block);
  });

  return prepared;
}

export function toLocalStorage(block: Block): LocalStorageBlock {
  return block;
}

export function toLocalStorageBulk(
  blocks: Record<string, Block>
): Record<string, LocalStorageBlock> {
  const prepared: Record<string, LocalStorageBlock> = {};

  Object.keys(blocks).forEach((externalId) => {
    const block = blocks[externalId];
    if (block) prepared[externalId] = toLocalStorage(block);
  });

  return prepared;
}
