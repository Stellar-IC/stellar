import { KeyboardEvent } from 'react';
import { parse } from 'uuid';

import { TextBlockBlockType } from '@/components/Editor/TextBlock/types';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { ExternalId } from '@/types';

import { useTextBlockEventHandlers } from '../useTextBlockEventHandlers';

import { useArrowDownHandler } from './useArrowDownHandler';
import { useArrowUpHandler } from './useArrowUpHandler';
import { useBackspaceHandler } from './useBackspaceHandler';
import { useCutHandler } from './useCutHandler';
import { useEnterHandler } from './useEnterHandler';
import { useShiftTabHandler } from './useShiftTabHandler';
import { useTabHandler } from './useTabHandler';
import { useWordCharacterHandler } from './useWordCharacterHandler';

type UseTextBlockKeyboardEventHandlersProps = {
  blockExternalId: ExternalId;
  blockIndex: number;
  blockType: TextBlockBlockType;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  showPlaceholder: () => void;
  hidePlaceholder: () => void;
};

function getClipboardText(clipboardData: DataTransfer) {
  return clipboardData.getData('text/plain');
}

function getCursorPosition() {
  const cursorPosition = window.getSelection()?.anchorOffset;

  if (cursorPosition === undefined) {
    throw new Error('No cursor position');
  }

  return cursorPosition;
}

function insertTextAtPosition(
  clipboardText: string,
  position: number,
  target: HTMLSpanElement
) {
  const characters = target.innerText.split('');
  const clipboardCharacters = clipboardText.split('');

  characters.splice(position, 0, ...clipboardCharacters);
  target.innerText = characters.join(''); // eslint-disable-line no-param-reassign
}

function setCursorAtEnd(target: HTMLSpanElement) {
  const selection = window.getSelection();

  if (selection) {
    const range = document.createRange();

    range.setStart(target.childNodes[0], target.innerText.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }
}

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

  const onRemoveBlock = () => {
    if (!parentBlockExternalId) return;

    // Note: We add 1 to the block index because the current functionality
    // for removing a block is to remove the block before the given position.
    removeBlock(parse(parentBlockExternalId), blockIndex + 1);
  };

  const { onCharacterInserted, onCharactersRemoved, onCharactersInserted } =
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
    onRemove: onCharactersRemoved,
    showPlaceholder,
  });

  const handleCut = useCutHandler({
    onRemove: onCharactersRemoved,
    showPlaceholder,
  });

  const handleEnter = useEnterHandler({
    blockExternalId,
    blockIndex,
    blockType,
    parentBlockExternalId,
  });

  const handleWordCharacter = useWordCharacterHandler({
    onCharacterInserted,
    hidePlaceholder,
  });

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    const { key, shiftKey, metaKey, ctrlKey } = e;

    if (key === 'Enter' && !shiftKey) {
      e.preventDefault();

      return handleEnter();
    }

    if (key === 'Tab') {
      e.preventDefault();

      if (shiftKey) {
        return handleShiftTab();
      }

      return handleTab();
    }

    if (key === 'Backspace') {
      return handleBackspace(e, {
        hasParentBlock: Boolean(parentBlockExternalId),
        onRemoveBlock,
      });
    }

    if (key === 'ArrowDown') {
      return handleArrowDown();
    }

    if (key === 'ArrowUp') {
      return handleArrowUp();
    }

    if (key.match(/^[\w\W]$/g) && !metaKey && !ctrlKey) {
      return handleWordCharacter(key, e.currentTarget);
    }

    return false;
  };

  const onCut = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();

    return handleCut({
      shouldRemoveBlock: false,
      shouldShowPlaceholder: false,
      onRemoveBlock,
    });
  };

  const onPaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();

    const { clipboardData } = e;
    const clipboardText = getClipboardText(clipboardData);
    const cursorPosition = getCursorPosition();
    const target = e.currentTarget;

    if (clipboardText.length === 0) {
      return;
    }

    insertTextAtPosition(clipboardText, cursorPosition, target);
    onCharactersInserted(clipboardText.split(''), cursorPosition);
    setCursorAtEnd(target);
    hidePlaceholder();
  };

  return {
    onKeyDown,
    onPaste,
    onCut,
  };
};
