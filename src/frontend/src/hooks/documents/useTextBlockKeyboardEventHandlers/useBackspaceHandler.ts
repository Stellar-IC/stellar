import { useCallback } from 'react';

import { focusPreviousBlock } from '@/modules/editor/utils/focus';
import { deleteCharactersInSelectionRange } from '@/modules/editor/utils/selection';

type DoBackspaceOperationArgs = {
  hasParentBlock: boolean;
  onRemoveBlock: () => void;
};

export const useBackspaceHandler = (props: {
  removeCharacters: (cursorPosition: number) => void;
}) => {
  const { removeCharacters } = props;
  const doBackspaceOperation = useCallback(
    (
      e: React.KeyboardEvent<HTMLSpanElement>,
      args: DoBackspaceOperationArgs
    ) => {
      const { hasParentBlock, onRemoveBlock } = args;
      const selection = window.getSelection();
      const cursorPosition = selection?.anchorOffset;
      const shouldRemoveBlock =
        hasParentBlock && e.currentTarget.innerText === '';

      if (cursorPosition === undefined) return false;

      if (shouldRemoveBlock) {
        e.preventDefault();
        onRemoveBlock();
        focusPreviousBlock(true);

        return false;
      }

      if (selection?.type === 'Range') {
        e.preventDefault();

        return deleteCharactersInSelectionRange(e, selection, {
          onRemove: removeCharacters,
        });
      }

      removeCharacters(cursorPosition);

      return true;
    },
    [removeCharacters]
  );

  return doBackspaceOperation;
};
