import { KeyboardEvent } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { ExternalId } from '@/types';
import { BlockType } from '../../../../../declarations/workspace/workspace.did';
import { useTabHandler } from './useTabHandler';
import { useBackspaceHandler } from './useBackspaceHandler';
import { useEnterHandler } from './useEnterHandler';
import { useShiftTabHandler } from './useShiftTabHandler';
import { useArrowDownHandler } from './useArrowDownHandler';
import { useArrowUpHandler } from './useArrowUpHandler';
import { useTextBlockEventHandlers } from '../useTextBlockEventHandlers';

type UseTextBlockKeyboardEventHandlersProps = {
  blockExternalId: ExternalId;
  blockIndex: number;
  blockType: BlockType;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  showPlaceholder?: () => void;
  hidePlaceholder?: () => void;
};

export const useTextBlockKeyboardEventHandlers = ({
  blockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  parentBlockIndex,
  showPlaceholder,
  hidePlaceholder,
}: UseTextBlockKeyboardEventHandlersProps) => {
  const { removeBlock } = usePagesContext();

  const { onCharacterInserted, onCharacterRemoved, onCharactersInserted } =
    useTextBlockEventHandlers({
      blockExternalId,
    });
  const handleTab = useTabHandler({
    blockIndex,
    blockExternalId,
    parentBlockExternalId,
  });
  const handleShiftTab = useShiftTabHandler({
    blockIndex,
    blockExternalId,
    parentBlockExternalId,
    parentBlockIndex,
  });
  const handleArrowDown = useArrowDownHandler();
  const handleArrowUp = useArrowUpHandler();
  const handleBackspace = useBackspaceHandler({
    onRemove: onCharacterRemoved,
    showPlaceholder,
  });
  const handleEnter = useEnterHandler({
    blockExternalId,
    blockIndex,
    blockType,
    parentBlockExternalId,
  });
  const handleWordCharacter = (
    character: string,
    { shouldHidePlaceholder }: { shouldHidePlaceholder?: boolean } = {}
  ) => {
    const cursorPosition = window.getSelection()?.anchorOffset;

    if (cursorPosition === undefined) {
      throw new Error('No cursor position');
    }

    if (shouldHidePlaceholder && hidePlaceholder) {
      hidePlaceholder();
    }

    onCharacterInserted(cursorPosition, character);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.metaKey || e.ctrlKey) return false;

    if (e.key === 'Enter') {
      e.preventDefault();
      return handleEnter();
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        return handleShiftTab();
      }
      return handleTab();
    }

    if (e.key === 'Backspace') {
      const cursorPosition = window.getSelection()?.anchorOffset;
      const shouldRemoveBlock =
        Boolean(parentBlockExternalId) && e.currentTarget.innerText === '';
      const shouldShowPlaceholder =
        e.currentTarget.innerText.length === 1 && cursorPosition === 1;

      return handleBackspace({
        shouldRemoveBlock,
        shouldShowPlaceholder,
        onRemoveBlock: () => {
          if (!parentBlockExternalId) return;
          // Note: We add 1 to the block index because the current functionality
          // for removing a block is to remove the block before the given position.
          removeBlock(parse(parentBlockExternalId), blockIndex + 1);
        },
      });
    }

    if (e.key === 'ArrowDown') {
      return handleArrowDown();
    }

    if (e.key === 'ArrowUp') {
      return handleArrowUp();
    }

    if (e.key.match(/^[\w\W]$/g)) {
      const cursorPosition = window.getSelection()?.anchorOffset;
      const shouldHidePlaceholder =
        cursorPosition === 0 && e.currentTarget.innerText.length === 0;

      return handleWordCharacter(e.key, {
        shouldHidePlaceholder,
      });
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();

    const text = e.clipboardData.getData('text/plain');
    const cursorPosition = window.getSelection()?.anchorOffset;

    if (cursorPosition === undefined) {
      throw new Error('No cursor position');
    }

    // Since we're using a contenteditable span and preventing default behavior,
    // we need to manually insert the text at the cursor position.
    const spliced = e.currentTarget.innerText.split('');
    spliced.splice(cursorPosition, 0, ...text.split(''));
    e.currentTarget.innerText = spliced.join('');

    // Insert the characters into the tree
    onCharactersInserted(cursorPosition, text.split(''));

    // Set the cursor position to the end of the pasted text
    const newCursorPosition = cursorPosition + text.length;
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.setStart(e.currentTarget.childNodes[0], newCursorPosition);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return {
    onKeyDown,
    onPaste,
  };
};
