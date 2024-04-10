import { useCallback } from 'react';

type UseCutHandlerProps = {
  removeCharacters: (startCursor: number, endCursor?: number) => void;
  showPlaceholder?: () => void;
};

type DoCutOperationArgs = {
  shouldRemoveBlock?: boolean;
  shouldShowPlaceholder?: boolean;
  onRemoveBlock?: () => void;
};

export const useCutHandler = ({
  removeCharacters,
  showPlaceholder,
}: UseCutHandlerProps) => {
  const doCutOperation = useCallback(
    (
      e: React.ClipboardEvent<HTMLSpanElement>,
      { shouldShowPlaceholder }: DoCutOperationArgs
    ) => {
      const selection = window.getSelection();

      if (selection?.type === 'Range') {
        let startCursor = selection.anchorOffset;
        let endCursor = selection.focusOffset;

        if (startCursor > endCursor) {
          startCursor = selection.focusOffset;
          endCursor = selection.anchorOffset;
        }

        document.execCommand('copy');
        removeCharacters(startCursor, endCursor);
        selection.deleteFromDocument();
      }

      // If the block will be empty, show the placeholder
      if (shouldShowPlaceholder && showPlaceholder) {
        showPlaceholder();
      }
    },
    [removeCharacters, showPlaceholder]
  );

  return doCutOperation;
};
