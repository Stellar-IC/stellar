import { Tree } from '@stellar-ic/lseq-ts';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';

import { Block, ExternalId } from '@/types';

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

export const insertBlockTitleCharacters = (
  block: Block,
  characters: string,
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  const { title } = block.properties;

  characters.split('').forEach((character, index) => {
    const events = Tree.insertCharacter(title, index, character);
    allEvents.push(...events);
  });

  const updatedBlock = {
    ...block,
    properties: {
      ...block.properties,
      title,
    },
  };
  onUpdateLocal(updatedBlock);
  onUpdateRemote(updatedBlock, allEvents);
};

export const removeBlockTitleCharacters = (
  block: Block,
  characterIndexes: number[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) => {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  const { title } = block.properties;
  const newTitle = Tree.clone(title);

  characterIndexes.forEach((characterIndex) => {
    const event = Tree.removeCharacter(newTitle, characterIndex - 1);
    if (event) allEvents.push(event);
  });

  const updatedBlock = {
    ...block,
    properties: {
      ...block.properties,
      title: newTitle,
    },
  };
  onUpdateLocal(updatedBlock);
  onUpdateRemote(updatedBlock, allEvents);
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
    const events = Tree.insertCharacter(block.content, index, item);
    allEvents.push(...events);
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
    const event = Tree.removeCharacter(block.content, index);
    if (event) allEvents.push(event);
  });
  onUpdateLocal(block);
  onUpdateRemote(block, allEvents);
};
