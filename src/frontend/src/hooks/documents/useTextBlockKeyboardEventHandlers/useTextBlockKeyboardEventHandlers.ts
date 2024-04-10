import { KeyboardEvent, useCallback } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { store, useStoreQuery } from '@/modules/data-store';
import * as EditorActionModule from '@/modules/editor/EditorAction';
import { setCursorAtEnd } from '@/modules/editor/utils/selection';

import { UseTextBlockKeyboardEventHandlersProps } from './types';
import { useArrowDownHandler } from './useArrowDownHandler';
import { useArrowUpHandler } from './useArrowUpHandler';
import { useBackspaceHandler } from './useBackspaceHandler';
import { useCutHandler } from './useCutHandler';
import { useEnterHandler } from './useEnterHandler';
import { useShiftTabHandler } from './useShiftTabHandler';
import { useTabHandler } from './useTabHandler';
import { useWordCharacterHandler } from './useWordCharacterHandler';
import {
  insertTextAtPosition,
  onCharacterInserted,
  onCharactersRemoved,
} from './utils';

type EditorAction = EditorActionModule.EditorAction;

const { EditorAction } = EditorActionModule;

export const useTextBlockKeyboardEventHandlers = ({
  blockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  parentBlockIndex,
  showPlaceholder,
  hidePlaceholder,
}: // onError,
UseTextBlockKeyboardEventHandlersProps) => {
  const { workspaceId } = useWorkspaceContext();
  const { userId } = useAuthContext();
  const { removeBlock } = usePagesContext();
  const block = useStoreQuery(() => store.blocks.get(blockExternalId));

  const onRemoveBlock = useCallback(() => {
    if (!parentBlockExternalId) return;

    // Note: We add 1 to the block index because the current functionality
    // for removing a block is to remove the block before the given position.
    removeBlock(parse(parentBlockExternalId), blockIndex + 1);
  }, [blockIndex, parentBlockExternalId, removeBlock]);

  const removeCharacters = useCallback(
    (cursorPosition: number) => {
      if (!block) throw new Error('Block not found');
      const context = { block, workspaceId, userId };
      onCharactersRemoved(context, cursorPosition);
    },
    [block, userId, workspaceId]
  );

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
    removeCharacters,
  });

  const handleCut = useCutHandler({
    removeCharacters,
    showPlaceholder,
  });

  const handleEnter = useEnterHandler({
    blockExternalId,
    blockIndex,
    blockType,
    parentBlockExternalId,
  });

  const handleWordCharacter = useWordCharacterHandler({
    onCharacterInserted: (cursorPosition, character) => {
      if (!block) throw new Error('Block not found');

      onCharacterInserted(
        { block, workspaceId, userId },
        cursorPosition,
        character
      );
    },
    hidePlaceholder,
  });

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      const { key } = e;
      let editorAction: EditorAction;

      try {
        editorAction = EditorActionModule.fromKeyboardEvent(e);
      } catch (error) {
        return false;
      }

      const editorActionHandlers = {
        [EditorAction.Tab]: () => {
          e.preventDefault();
          handleTab();
        },
        [EditorAction.ShiftTab]: () => {
          e.preventDefault();
          handleShiftTab();
        },
        [EditorAction.ArrowDown]: () => handleArrowDown(),
        [EditorAction.ArrowUp]: () => handleArrowUp(),
        [EditorAction.Backspace]: () =>
          handleBackspace(e, {
            hasParentBlock: Boolean(parentBlockExternalId),
            onRemoveBlock,
          }),
        [EditorAction.Enter]: () => {
          e.preventDefault();
          handleEnter();
        },
        [EditorAction.Character]: () =>
          handleWordCharacter(key, e.currentTarget),
      };

      if (editorActionHandlers[editorAction]) {
        return editorActionHandlers[editorAction]();
      }

      return false;
    },
    [
      handleArrowDown,
      handleArrowUp,
      handleBackspace,
      handleEnter,
      handleTab,
      handleShiftTab,
      handleWordCharacter,
      parentBlockExternalId,
      onRemoveBlock,
    ]
  );

  const onCut = useCallback(
    (e: React.ClipboardEvent<HTMLSpanElement>) => {
      e.preventDefault();

      return handleCut(e, {
        shouldShowPlaceholder: false,
      });
    },
    [handleCut]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLSpanElement>) => {
      e.preventDefault();

      const { clipboardData } = e;
      const clipboardText = clipboardData.getData('text/plain');
      const cursorPosition = window.getSelection()?.anchorOffset;
      const target = e.currentTarget;

      if (clipboardText.length === 0) {
        return;
      }

      if (cursorPosition === undefined) {
        throw new Error('Unable to determine cursor position');
      }

      if (!block) throw new Error('Block not found');

      insertTextAtPosition(
        {
          block,
          workspaceId,
          userId,
        },
        clipboardText,
        cursorPosition,
        target
      );

      setCursorAtEnd(target);
      hidePlaceholder();
    },
    [block, hidePlaceholder, userId, workspaceId]
  );

  return {
    onKeyDown,
    onPaste,
    onCut,
  };
};
