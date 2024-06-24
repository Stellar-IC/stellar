import { Tree } from '@/modules/lseq';
import { Block } from '@/types';

import { TreeEvent } from '../../../../declarations/workspace/workspace.did';

// TODO: Move this into EditorController
export function insertTitleCharacters(
  block: Block,
  characters: string,
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  const { title } = block.properties;

  characters.split('').forEach((character, index) => {
    const events = Tree.insertValue(title, index, character);
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
}

// TODO: Move this into EditorController
export function removeTitleCharactersByIndex(
  block: Block,
  characterIndexes: number[],
  opts: {
    onUpdateLocal: (block: Block) => void;
    onUpdateRemote: (block: Block, events: TreeEvent[]) => void;
  }
) {
  const { onUpdateLocal, onUpdateRemote } = opts;
  const allEvents: TreeEvent[] = [];
  const { title } = block.properties;
  const newTitle = Tree.clone(title);

  characterIndexes.forEach((characterIndex) => {
    const event = Tree.deleteValue(newTitle, characterIndex - 1);
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
}

export function clone(block: Block | null) {
  if (!block) return null;

  return {
    ...block,
    content: Tree.clone(block.content),
    properties: {
      ...block.properties,
      title: Tree.clone(block.properties.title),
    },
  };
}
