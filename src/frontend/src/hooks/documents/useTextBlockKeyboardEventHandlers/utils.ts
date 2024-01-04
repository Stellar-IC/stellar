import { Block, ExternalId } from '@/types';
import { Tree } from '@stellar-ic/lseq-ts';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';

export const updateBlockParent = (
  block: Block,
  parent: ExternalId,
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const updatedBlock = {
    ...block,
    parent,
  };
  onUpdateLocal(updatedBlock);
  onUpdateRemote(updatedBlock);
};

export const insertBlockContent = (
  block: Block,
  data: { index: number; item: ExternalId }[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  data.forEach((x) => {
    const { index, item } = x;
    Tree.insertCharacter(block.content, index, item, (events) => {
      allEvents.push(...events);
    });
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
};

export const removeBlockContent = (
  block: Block,
  indexes: number[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  indexes.forEach((index) => {
    // We are removing the character at index + 1 because we want to remove the
    // character before the "cursor"
    Tree.removeCharacter(block.content, index + 1, (event) => {
      allEvents.push(event);
    });
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
};
