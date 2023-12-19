import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { ExternalId } from '@/types';
import { Tree } from '@stellar-ic/lseq-ts';
import { useSuccessHandlers } from './useSuccessHandlers';

interface UseTextBlockEventHandlersProps {
  blockExternalId: ExternalId;
}

export const useTextBlockEventHandlers = ({
  blockExternalId,
}: UseTextBlockEventHandlersProps) => {
  const {
    blocks: { data, updateLocal: updateLocalBlock },
  } = usePagesContext();

  const block = data[blockExternalId];

  const { onInsertSuccess, onRemoveSuccess } = useSuccessHandlers({
    block,
    updateLocalBlock,
  });

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
    onCharacterInserted,
    onCharacterRemoved,
  };
};
