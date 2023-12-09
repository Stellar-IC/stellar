import { useCallback } from 'react';

type UseBackspaceHandlerProps = {
  onRemove: (cursorPosition: number) => void;
  showPlaceholder?: () => void;
};

type DoBackspaceOperationArgs = {
  shouldRemoveBlock?: boolean;
  shouldShowPlaceholder?: boolean;
  onRemoveBlock?: () => void;
};

export const useBackspaceHandler = ({
  onRemove,
  showPlaceholder,
}: UseBackspaceHandlerProps) => {
  const doBackspaceOperation = useCallback(
    ({
      shouldRemoveBlock,
      shouldShowPlaceholder,
      onRemoveBlock,
    }: DoBackspaceOperationArgs) => {
      if (shouldRemoveBlock) {
        if (!onRemoveBlock) return;
        onRemoveBlock();
        return false;
      }

      const cursorPosition = window.getSelection()?.anchorOffset;
      if (cursorPosition) onRemove(cursorPosition);

      // If the block will be empty, show the placeholder
      if (shouldShowPlaceholder && showPlaceholder) {
        showPlaceholder();
      }
    },
    [onRemove, showPlaceholder]
  );

  return doBackspaceOperation;
};
