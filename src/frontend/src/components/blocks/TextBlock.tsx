import { Box, useMantineTheme } from '@mantine/core';
import { createRef, useEffect, useMemo, useState } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Tree } from '@/modules/lseq';
import { ExternalId } from '@/types';

type TextBlockProps = {
  blockExternalId: ExternalId;
  blockType:
    | { paragraph: null }
    | { heading1: null }
    | { heading2: null }
    | { heading3: null };
  pageExternalId?: ExternalId;
  value: Tree.Tree;
  onEnterPressed?: () => void;
  onInsert: (cursorPosition: number, character: string) => void;
  onRemove: (cursorPosition: number) => void;
};

export const TextBlock = ({
  blockType,
  blockExternalId,
  pageExternalId,
  value,
  onEnterPressed,
  onInsert,
  onRemove,
}: TextBlockProps) => {
  const { removeBlock } = usePagesContext();
  const theme = useMantineTheme();
  const [initialText] = useState(Tree.toText(value));

  // A transaction is a change to a block. It is a list of operations that
  // are applied to the block. For example, if you change the text of a
  // paragraph, the transaction would be a list of operations that would
  // change the text of the paragraph.

  const textBoxRef = useMemo(() => createRef<HTMLSpanElement>(), []);

  const fontSize = useMemo(() => {
    if ('paragraph' in blockType) return theme.fontSizes.sm;
    if ('heading3' in blockType) return theme.fontSizes.md;
    if ('heading2' in blockType) return theme.fontSizes.lg;
    return theme.fontSizes.xl;
  }, [blockType, theme.fontSizes]);

  useEffect(() => {
    if (!textBoxRef.current) return;
    textBoxRef.current.innerText = initialText;
  }, [initialText, textBoxRef]);

  return (
    <Box
      className="TextBlock"
      pos="relative"
      mih="24px"
      bg="#eee"
      h="100%"
      w="100%"
      style={{ border: '1px solid #fff', fontSize }}
    >
      <span
        tabIndex={0}
        ref={textBoxRef}
        role="textbox"
        contentEditable
        style={{ outline: 'none' }}
        suppressContentEditableWarning
        onKeyDown={(e) => {
          if (e.metaKey || e.ctrlKey) return false;
          if (onEnterPressed && e.key === 'Enter') {
            e.preventDefault();
            onEnterPressed();
            return false;
          }
          if (e.key === 'Backspace') {
            if (pageExternalId && e.currentTarget.innerText === '') {
              removeBlock(parse(pageExternalId), parse(blockExternalId));
              return false;
            }
            const cursorPosition = window.getSelection()?.anchorOffset;

            if (cursorPosition) onRemove(cursorPosition);
          }
          if (e.key.match(/^[\w\W]$/g)) {
            const cursorPosition = window.getSelection()?.anchorOffset;

            if (cursorPosition === undefined) {
              throw new Error('No cursor position');
            }

            onInsert(cursorPosition, e.key);
          }
        }}
      />
      {/* <TreeViewer tree={value} /> */}
    </Box>
  );
};
