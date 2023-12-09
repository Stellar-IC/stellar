import { KeyboardEvent } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Tree } from '@myklenero/stellar-lseq-typescript';
import { ExternalId } from '@/types';

type UseTextBlockKeyboardEventHandlersProps = {
  blockIndex: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
  onEnterPressed?: () => void;
  onInsert: (cursorPosition: number, character: string) => void;
  onRemove: (cursorPosition: number) => void;
  showPlaceholder?: () => void;
  hidePlaceholder?: () => void;
};

export const useTextBlockKeyboardEventHandlers = ({
  blockIndex,
  blockExternalId,
  parentBlockExternalId,
  onEnterPressed,
  onInsert,
  onRemove,
  showPlaceholder,
  hidePlaceholder,
}: UseTextBlockKeyboardEventHandlersProps) => {
  const {
    pages: { data: pages },
    blocks: { data: blocks, updateLocal: updateLocalBlock },
    removeBlock,
    updateBlock,
  } = usePagesContext();

  const parentBlock = parentBlockExternalId
    ? pages[parentBlockExternalId] || blocks[parentBlockExternalId]
    : null;

  const handleTab = () => {
    // Change the parent block of the current block
    if (blockIndex === 0) {
      // If the block is the first block, do nothing
      return false;
    }

    if (!parentBlock) return false;

    // Find the previous block
    const previousBlockExternalId = Tree.getNodeAtPosition(
      parentBlock.content,
      blockIndex - 1
    )?.value;
    const previousBlock = blocks[previousBlockExternalId];
    if (!previousBlock) return false;

    const blockToMove = blocks[blockExternalId];
    if (!blockToMove) return false;

    // Update the block's parent on chain
    updateBlock(parse(blockExternalId), {
      updateParent: {
        data: {
          blockExternalId: parse(blockExternalId),
          parentBlockExternalId: parse(previousBlockExternalId),
        },
      },
    });

    // Update the previous block's content to include the new block
    updateBlock(parse(previousBlockExternalId), {
      updateContent: {
        data: {
          blockExternalId: parse(previousBlockExternalId),
          transaction: [
            {
              insert: {
                transactionType: { insert: null },
                position: Tree.buildNodeForEndInsert(
                  previousBlock.content,
                  blockToMove.uuid
                ).identifier.value,
                value: blockToMove.uuid,
              },
            },
          ],
        },
      },
    });

    updateBlock(parse(parentBlock.uuid), {
      updateContent: {
        data: {
          blockExternalId: parse(parentBlock.uuid),
          transaction: [
            {
              delete: {
                transactionType: { delete: null },
                position: Tree.getNodeAtPosition(
                  parentBlock.content,
                  blockIndex
                ).identifier.value,
              },
            },
          ],
        },
      },
    });

    const newBlockIndex = Tree.size(previousBlock.content);

    // Remove the block from its current position
    Tree.removeCharacter(parentBlock.content, blockIndex + 1, () => {});
    updateLocalBlock(parentBlock.uuid, parentBlock);

    // Add the block to the new position
    Tree.insertCharacter(
      previousBlock.content,
      newBlockIndex,
      blockToMove.uuid,
      () => {}
    );
    updateLocalBlock(previousBlock.uuid, previousBlock);

    blockToMove.parent = previousBlockExternalId;
  };

  const handleBackspace = ({
    shouldRemoveBlock,
    shouldShowPlaceholder,
    onRemoveBlock,
  }: {
    shouldRemoveBlock?: boolean;
    shouldShowPlaceholder?: boolean;
    onRemoveBlock?: () => void;
  }) => {
    // If the block is empty, remove it
    if (shouldRemoveBlock) {
      if (!onRemoveBlock) return;
      // Note: We add 1 to the block index because the current functionality
      // for removing a block is to remove the block before the given position.
      onRemoveBlock();
      return false;
    }

    // Handle backspace
    const cursorPosition = window.getSelection()?.anchorOffset;
    if (cursorPosition) onRemove(cursorPosition);

    // If the block will be empty, show the placeholder
    if (shouldShowPlaceholder && showPlaceholder) {
      showPlaceholder();
    }
  };

  const handleArrowDown = () => {
    const blocksDiv = document.querySelector('.Blocks');
    if (!blocksDiv) return;
    const blockToFocus =
      blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[blockIndex + 2];
    blockToFocus?.querySelector('span')?.focus();
  };

  const handleArrowUp = () => {
    const blocksDiv = document.querySelector('.Blocks');
    if (!blocksDiv) return;
    const blockToFocus =
      blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[blockIndex];
    blockToFocus?.querySelector('span')?.focus();
  };

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

    if (onEnterPressed && e.key === 'Enter') {
      e.preventDefault();
      onEnterPressed();
      return false;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
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
