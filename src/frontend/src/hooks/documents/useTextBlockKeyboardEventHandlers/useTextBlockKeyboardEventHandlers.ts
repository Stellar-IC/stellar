import { KeyboardEvent } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { ExternalId } from '@/types';
import { useTabHandler } from './useTabHandler';
import { useBackspaceHandler } from './useBackspaceHandler';
import { useArrowDownHandler } from './useArrowDownHandler';
import { useArrowUpHandler } from './useArrowUpHandler';
import { useEnterHandler } from './useEnterHandler';
import { BlockType } from '../../../../../declarations/workspace/workspace.did';
import { useShiftTabHandler } from './useShiftTabHandler';

type UseTextBlockKeyboardEventHandlersProps = {
  blockExternalId: ExternalId;
  blockIndex: number;
  blockType: BlockType;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  onInsert: (cursorPosition: number, character: string) => void;
  onRemove: (cursorPosition: number) => void;
  showPlaceholder?: () => void;
  hidePlaceholder?: () => void;
};

export const useTextBlockKeyboardEventHandlers = ({
  blockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  parentBlockIndex,
  onInsert,
  onRemove,
  showPlaceholder,
  hidePlaceholder,
}: UseTextBlockKeyboardEventHandlersProps) => {
  const { removeBlock } = usePagesContext();

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
    onRemove,
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

    onInsert(cursorPosition, character);
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
    let cursorPosition = window.getSelection()?.anchorOffset;
    if (cursorPosition === undefined) {
      throw new Error('No cursor position');
    }
    for (const character of text) {
      onInsert(cursorPosition, character);
      cursorPosition += 1;
    }
  };

  return {
    onKeyDown,
    onPaste,
  };
};
