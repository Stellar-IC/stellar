import { useCallback } from 'react';
import { focusPreviousBlock } from '@/modules/editor/utils';

type UseBackspaceHandlerProps = {
  onRemove: (startCursor: number, endCursor?: number) => void;
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
        if (onRemoveBlock) {
          onRemoveBlock();
        }

        focusPreviousBlock(true);

        return false;
      }

      const selection = window.getSelection();

      if (selection?.type === 'Range') {
        let startCursor = selection.anchorOffset;
        let endCursor = selection.focusOffset;

        if (startCursor > endCursor) {
          startCursor = selection.focusOffset;
          endCursor = selection.anchorOffset;
        }

        onRemove(startCursor, endCursor);
        selection?.deleteFromDocument();
      } else {
        const cursorPosition = selection?.anchorOffset;
        if (cursorPosition) onRemove(cursorPosition);
      }

      // If the block will be empty, show the placeholder
      if (shouldShowPlaceholder && showPlaceholder) {
        showPlaceholder();
      }
    },
    [onRemove, showPlaceholder]
  );

  return doBackspaceOperation;
};
