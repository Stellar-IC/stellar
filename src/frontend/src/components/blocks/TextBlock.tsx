import { Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { createRef, useEffect, useMemo, useState } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Tree } from '@/modules/lseq';
import { ExternalId } from '@/types';

type TextBlockProps = {
  blockIndex: number;
  blockType:
    | { paragraph: null }
    | { heading1: null }
    | { heading2: null }
    | { heading3: null }
    | { todoList: null }
    | { bulletedList: null }
    | { numberedList: null }
    | { toggleList: null }
    | { code: null }
    | { quote: null }
    | { callout: null };
  pageExternalId?: ExternalId;
  placeholder?: string;
  value: Tree.Tree;
  onEnterPressed?: () => void;
  onInsert: (cursorPosition: number, character: string) => void;
  onRemove: (cursorPosition: number) => void;
};

export const TextBlock = ({
  blockIndex,
  blockType,
  // blockExternalId,
  pageExternalId,
  placeholder,
  value,
  onEnterPressed,
  onInsert,
  onRemove,
}: TextBlockProps) => {
  const { removeBlock } = usePagesContext();
  const [initialText] = useState(Tree.toText(value));
  const [
    isShowingPlaceholder,
    { close: hidePlaceholder, open: showPlaceholder },
  ] = useDisclosure(!initialText);

  // A transaction is a change to a block. It is a list of operations that
  // are applied to the block. For example, if you change the text of a
  // paragraph, the transaction would be a list of operations that would
  // change the text of the paragraph.

  const textBoxRef = useMemo(() => createRef<HTMLSpanElement>(), []);

  const textStyles = useMemo(() => {
    if (
      'paragraph' in blockType ||
      'todoList' in blockType ||
      'bulletedList' in blockType ||
      'numberedList' in blockType ||
      'toggleList' in blockType ||
      'code' in blockType ||
      'quote' in blockType ||
      'callout' in blockType
    ) {
      return {
        fontSize: '1rem',
      };
    }

    if ('heading3' in blockType) {
      return {
        fontWeight: 600,
        fontSize: '1.25em',
        lineHeight: 1.3,
      };
    }

    if ('heading2' in blockType) {
      return {
        fontWeight: 600,
        fontSize: '1.5em',
        lineHeight: 1.3,
      };
    }

    return {
      fontWeight: 600,
      fontSize: '1.875em',
      lineHeight: 1.3,
    };
  }, [blockType]);

  useEffect(() => {
    if (!textBoxRef.current) return;
    textBoxRef.current.innerText = initialText;
  }, [initialText, textBoxRef]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!textBoxRef.current) return;
  //     if (textBoxRef.current.innerText !== '' && isShowingPlaceholder) {
  //       hidePlaceholder();
  //     } else if (textBoxRef.current.innerText === '' && !isShowingPlaceholder) {
  //       showPlaceholder();
  //     }
  //   }, 0);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [
  //   initialText,
  //   textBoxRef,
  //   isShowingPlaceholder,
  //   hidePlaceholder,
  //   showPlaceholder,
  // ]);

  return (
    <Box
      className="TextBlock"
      pos="relative"
      w="100%"
      style={{ ...textStyles }}
    >
      {placeholder && isShowingPlaceholder && (
        <Box
          pos="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          style={{ pointerEvents: 'none', color: '#999', zIndex: 1 }}
        >
          {placeholder}
        </Box>
      )}
      <span
        tabIndex={0}
        ref={textBoxRef}
        role="textbox"
        contentEditable
        style={{ outline: 'none', display: 'block', minHeight: '24px' }}
        suppressContentEditableWarning
        onKeyDown={(e) => {
          if (e.metaKey || e.ctrlKey) return false;
          if (onEnterPressed && e.key === 'Enter') {
            e.preventDefault();
            onEnterPressed();
            return false;
          }
          if (e.key === 'Backspace') {
            // If the block is empty, remove it
            if (pageExternalId && e.currentTarget.innerText === '') {
              // Note: We add 1 to the block index because the current functionality
              // for removing a block is to remove the block before the given position.
              removeBlock(parse(pageExternalId), blockIndex + 1);
              return false;
            }

            // Handle backspace
            const cursorPosition = window.getSelection()?.anchorOffset;
            if (cursorPosition) onRemove(cursorPosition);

            // If the block will be empty, show the placeholder
            if (
              e.currentTarget.innerText.length === 1 &&
              cursorPosition === 1
            ) {
              showPlaceholder();
            }
          } else if (e.key.match(/^[\w\W]$/g)) {
            const cursorPosition = window.getSelection()?.anchorOffset;

            if (cursorPosition === undefined) {
              throw new Error('No cursor position');
            }

            if (
              cursorPosition === 0 &&
              e.currentTarget.innerText.length === 0
            ) {
              hidePlaceholder();
            }

            onInsert(cursorPosition, e.key);
          }
        }}
      />
    </Box>
  );
};
