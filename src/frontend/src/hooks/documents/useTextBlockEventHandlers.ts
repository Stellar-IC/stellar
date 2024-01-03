import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { Block, ExternalId } from '@/types';
import { Tree } from '@stellar-ic/lseq-ts';
import { useSuccessHandlers } from './useSuccessHandlers';

interface UseTextBlockEventHandlersProps {
  blockExternalId: ExternalId;
}

export const useTextBlockEventHandlers = ({
  blockExternalId,
}: UseTextBlockEventHandlersProps) => {
  const {
    blocks: { updateLocal: updateLocalBlock },
  } = usePagesContext();

  const { get } = useDataStoreContext();

  const block = get<Block>(DATA_TYPES.block, blockExternalId);

  if (!block) throw new Error(`Block not found: ${blockExternalId}`);

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
