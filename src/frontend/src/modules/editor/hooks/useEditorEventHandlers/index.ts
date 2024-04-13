import { Tree } from '@stellar-ic/lseq-ts';
import { isEqual } from 'lodash';
import { KeyboardEvent, useCallback } from 'react';
import { parse } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import * as BlockModule from '@/modules/blocks';
import { store, useStoreQuery } from '@/modules/data-store';
import * as EditorActionModule from '@/modules/editor/EditorAction';
import { useEditorActions } from '@/modules/editor/hooks/useEditorActions';
import { setCursorAtEnd } from '@/modules/editor/utils/selection';

import { BlockType } from '../../../../../../declarations/workspace/workspace.did';
import { EditorController } from '../../EditorController';
import { focusBlock } from '../../utils/focus';

import { useEditorEventHandlersProps } from './types';
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
  removeCharacters as _removeCharacters,
  insertCharacter,
} from './utils';

type EditorAction = EditorActionModule.EditorAction;

const { EditorAction } = EditorActionModule;

export const useEditorEventHandlers = ({
  blockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  showPlaceholder,
  hidePlaceholder,
  onSave,
}: useEditorEventHandlersProps) => {
  const { workspaceId } = useWorkspaceContext();
  const { userId } = useAuthContext();
  const { removeBlock } = useEditorActions({ onSave });
  const block = useStoreQuery(() => store.blocks.get(blockExternalId), {
    clone: BlockModule.clone,
  });

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
      _removeCharacters(context, cursorPosition);
    },
    [block, userId, workspaceId]
  );

  const handleTab = useTabHandler({
    blockExternalId,
    onSave,
  });

  const handleShiftTab = useShiftTabHandler({
    blockExternalId,
    onSave,
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
    onSave,
  });

  const maxShortcutKeyLength = 3;
  const blockTransformShortcuts: Record<string, BlockType> = {
    '*': { bulletedList: null },
    '[]': { todoList: null },
    '[ ]': { todoList: null },
    '1.': { numberedList: null },
    '#': { heading1: null },
    '##': { heading2: null },
    '###': { heading3: null },
  };

  const handleWordCharacter = useWordCharacterHandler({
    onCharacterInserted: async (e, cursorPosition, character) => {
      if (!block) throw new Error('Block not found');

      const currentText = e.currentTarget.innerText;

      if (
        character === ' ' &&
        currentText.length <= maxShortcutKeyLength &&
        cursorPosition === Tree.size(block.properties.title) &&
        Object.keys(blockTransformShortcuts).includes(currentText) &&
        !isEqual(block.blockType, blockTransformShortcuts[currentText])
      ) {
        const blockType = blockTransformShortcuts[currentText];

        e.preventDefault();

        // Remove the asterisk and convert the block to a bullet list
        const editorController = new EditorController({ onSave });

        await editorController
          .removeBlockTitleCharactersByRange(
            parse(block.uuid),
            0,
            currentText.length
          )
          .save();

        await editorController
          .updateBlockBlockType(parse(block.uuid), blockType)
          .save();

        focusBlock(block.uuid);

        return;
      }

      insertCharacter(
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
        [EditorAction.Character]: () => handleWordCharacter(e, key),
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
