import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { ExternalId } from '@/types';
import { Tree } from '@myklenero/stellar-lseq-typescript';
import { parse } from 'uuid';
import { useSuccessHandlers } from './useSuccessHandlers';

interface UseTextBlockEventHandlersProps {
  blockExternalId: ExternalId;
  index: number;
}

export const useTextBlockEventHandlers = ({
  blockExternalId,
  index,
}: UseTextBlockEventHandlersProps) => {
  const {
    addBlock,
    blocks: { data, updateLocal: updateLocalBlock },
  } = usePagesContext();

  const block = data[blockExternalId];

  const { onInsertSuccess, onRemoveSuccess } = useSuccessHandlers({
    block,
    updateLocalBlock,
  });

  const onEnterPressed = () => {
    if (!block.parent) return;

    addBlock(parse(block.parent), block.blockType, index + 1);

    // Focus on the new block
    setTimeout(() => {
      const blocksDiv = document.querySelector('.Blocks');
      if (!blocksDiv) return;

      const blockToFocus =
        blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[index + 2];
      blockToFocus.querySelector('span')?.focus();
    }, 50);
  };

  const onCharacterInserted = (cursorPosition: number, character: string) =>
    Tree.insertCharacter(
      block.properties.title,
      cursorPosition,
      character,
      onInsertSuccess
    );

  const onCharacterRemoved = (cursorPosition: number) =>
    Tree.removeCharacter(
      block.properties.title,
      cursorPosition,
      onRemoveSuccess
    );

  return {
    onEnterPressed,
    onCharacterInserted,
    onCharacterRemoved,
  };
};
