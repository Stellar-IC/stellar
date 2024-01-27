import { useCallback } from 'react';

type UseCutHandlerProps = {
  onRemove: (startCursor: number, endCursor?: number) => void;
  showPlaceholder?: () => void;
};

type DoCutOperationArgs = {
  shouldRemoveBlock?: boolean;
  shouldShowPlaceholder?: boolean;
  onRemoveBlock?: () => void;
};

export const useCutHandler = ({
  onRemove,
  showPlaceholder,
}: UseCutHandlerProps) => {
  const doCutOperation = useCallback(
    ({
      shouldRemoveBlock,
      shouldShowPlaceholder,
      onRemoveBlock,
    }: DoCutOperationArgs) => {
      if (shouldRemoveBlock) {
        if (!onRemoveBlock) return;
        onRemoveBlock();
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
        document.execCommand('copy');
        selection.deleteFromDocument();
      }

      // If the block will be empty, show the placeholder
      if (shouldShowPlaceholder && showPlaceholder) {
        showPlaceholder();
      }
    },
    [onRemove, showPlaceholder]
  );

  return doCutOperation;
};
