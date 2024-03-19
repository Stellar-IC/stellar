import { Tree } from '@stellar-ic/lseq-ts';
import { useLiveQuery } from 'dexie-react-hooks';
import { KeyboardEvent } from 'react';
import { parse, v4 } from 'uuid';

import { TextBlockBlockType } from '@/components/Editor/TextBlock/types';
import { usePages } from '@/contexts/PagesContext/usePages';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { ExternalId } from '@/types';

import {
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  TreeEvent,
} from '../../../../../declarations/workspace/workspace.did';

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

enum EditorAction {
  ArrowDown = 'ArrowDown',
  ArrowUp = 'ArrowUp',
  Backspace = 'Backspace',
  Character = 'Character',
  Enter = 'Enter',
  ShiftTab = 'ShiftTab',
  Tab = 'Tab',
}

function parseKeydownEvent(e: KeyboardEvent<HTMLSpanElement>): EditorAction {
  const { key, shiftKey, metaKey, ctrlKey } = e;

  if (key === 'Enter' && !shiftKey) return EditorAction.Enter;
  if (key === 'Tab') {
    if (shiftKey) return EditorAction.ShiftTab;
    return EditorAction.Tab;
  }
  if (key === 'Backspace') return EditorAction.Backspace;
  if (key === 'ArrowDown') return EditorAction.ArrowDown;
  if (key === 'ArrowUp') return EditorAction.ArrowUp;
  if (key.match(/^[\w\W]$/g) && !metaKey && !ctrlKey) {
    return EditorAction.Character;
  }

  throw new Error('Unhandled keydown event');
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
  const { workspaceId } = useWorkspaceContext();
  const { identity, userId } = useAuthContext();
  const { removeBlock } = usePagesContext();
  const {
    blocks: { updateLocal: updateLocalBlock },
  } = usePages({ identity, workspaceId });
  const block = useLiveQuery(
    () => db.blocks.get(blockExternalId),
    [blockExternalId]
  );
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const onRemoveBlock = () => {
    if (!parentBlockExternalId) return;

    // Note: We add 1 to the block index because the current functionality
    // for removing a block is to remove the block before the given position.
    removeBlock(parse(parentBlockExternalId), blockIndex + 1);
  };

  const onSuccess = (title: Tree.Tree, events: TreeEvent[]) => {
    if (!block) throw new Error('Block not found');

    updateLocalBlock(block.uuid, {
      ...block,
      properties: {
        ...block.properties,
        title,
      },
    });

    sendUpdate([
      {
        transaction: [
          {
            user: userId,
            uuid: parse(v4()),
            data: {
              blockUpdated: {
                updatePropertyTitle: {
                  blockExternalId: parse(block.uuid),
                  transaction: events,
                },
              },
            },
            timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          },
        ],
      },
    ]);
  };

  const onCharacterInserted = (cursorPosition: number, character: string) => {
    if (!block) throw new Error('Block not found');

    const events = Tree.insertCharacter(
      block.properties.title,
      cursorPosition,
      character
    );
    onSuccess(block.properties.title, events);
  };

  const onCharactersInserted = (
    characters: string[],
    cursorPosition: number
  ) => {
    if (!block) throw new Error('Block not found');

    const allEvents: TreeEvent[] = [];

    characters.forEach((character, i) => {
      const events = Tree.insertCharacter(
        block.properties.title,
        cursorPosition + i,
        character
      );
      allEvents.push(...events);
    });

    onSuccess(block.properties.title, allEvents);
  };

  const onCharacterRemoved = (cursorPosition: number) => {
    if (!block) throw new Error('Block not found');

    const event = Tree.removeCharacter(
      block.properties.title,
      cursorPosition - 1
    );
    if (event) onSuccess(block.properties.title, [event]);
  };

  const onCharactersRemoved = (
    startPosition: number,
    endPosition?: number
  ): void => {
    if (!block) throw new Error('Block not found');

    if (endPosition === undefined) return onCharacterRemoved(startPosition);

    // Build index array in descending order so that we don't have to worry about
    // the index changing as we remove characters
    const characterIndexes = Array.from(
      { length: endPosition - startPosition },
      (_, i) => endPosition - i
    );
    const allEvents: TreeEvent[] = [];

    characterIndexes.forEach((index) => {
      const event = Tree.removeCharacter(block.properties.title, index - 1);
      if (event) allEvents.push(event);
    });

    onSuccess(block.properties.title, allEvents);

    return undefined;
  };

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
    const { key } = e;
    let editorAction: EditorAction;

    try {
      editorAction = parseKeydownEvent(e);
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
      [EditorAction.Character]: () => handleWordCharacter(key, e.currentTarget),
    };

    if (editorActionHandlers[editorAction]) {
      return editorActionHandlers[editorAction]();
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
