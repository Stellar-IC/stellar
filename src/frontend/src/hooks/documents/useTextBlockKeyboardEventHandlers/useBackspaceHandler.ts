import { useCallback } from 'react';

import { focusPreviousBlock } from '@/modules/editor/utils';

type UseBackspaceHandlerProps = {
  onRemove: (startCursor: number, endCursor?: number) => void;
  showPlaceholder: () => void;
};

type DoBackspaceOperationArgs = {
  hasParentBlock: boolean;
  onRemoveBlock: () => void;
};

function getRangeSelectionEndpoints(selection: Selection) {
  let startCursor = selection.anchorOffset;
  let endCursor = selection.focusOffset;

  if (startCursor > endCursor) {
    startCursor = selection.focusOffset;
    endCursor = selection.anchorOffset;
  }

  return [startCursor, endCursor];
}

export const useBackspaceHandler = ({
  onRemove,
  showPlaceholder,
}: UseBackspaceHandlerProps) => {
  const deleteCharactersInSelectionRange = useCallback(
    (selection: Selection) => {
      const [startCursor, endCursor] = getRangeSelectionEndpoints(selection);

      onRemove(startCursor, endCursor);
      selection?.deleteFromDocument();

      return false;
    },
    [onRemove]
  );

  const doBackspaceOperation = useCallback(
    (
      e: React.KeyboardEvent<HTMLSpanElement>,
      args: DoBackspaceOperationArgs
    ) => {
      const { hasParentBlock, onRemoveBlock } = args;
      const selection = window.getSelection();
      const cursorPosition = selection?.anchorOffset;
      const target = e.currentTarget;
      const shouldRemoveBlock = hasParentBlock && target.innerText === '';
      const isLastCharacter =
        target.innerText.length === 1 && cursorPosition === 1;

      if (cursorPosition === undefined) return false;

      if (shouldRemoveBlock) {
        e.preventDefault();
        onRemoveBlock();
        focusPreviousBlock(true);

        return false;
      }

      if (selection?.type === 'Range') {
        e.preventDefault();

        return deleteCharactersInSelectionRange(selection);
      }

      onRemove(cursorPosition);

      if (isLastCharacter) {
        showPlaceholder();
      }

      return true;
    },
    [deleteCharactersInSelectionRange, onRemove, showPlaceholder]
  );

  return doBackspaceOperation;
};
