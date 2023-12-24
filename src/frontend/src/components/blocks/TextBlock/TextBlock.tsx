import { Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Tree } from '@stellar-ic/lseq-ts';
import { createRef, useEffect, useMemo, useState } from 'react';

import { useTextBlockKeyboardEventHandlers } from '@/hooks/documents/useTextBlockKeyboardEventHandlers';

import { useTextStyles } from './hooks/useTextStyles';
import { TextBlockProps } from './types';

export const TextBlock = ({
  blockIndex,
  parentBlockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  placeholder,
  value,
  onInsert,
  onRemove,
}: TextBlockProps) => {
  const [initialText] = useState(Tree.toText(value));
  const [
    isShowingPlaceholder,
    { close: hidePlaceholder, open: showPlaceholder },
  ] = useDisclosure(!initialText);
  const textBoxRef = useMemo(() => createRef<HTMLSpanElement>(), []);
  const textStyles = useTextStyles({ blockType });

  useEffect(() => {
    if (!textBoxRef.current) return;
    textBoxRef.current.innerText = initialText;
  }, [initialText, textBoxRef]);

  const { onKeyDown, onPaste } = useTextBlockKeyboardEventHandlers({
    blockExternalId,
    blockIndex,
    blockType,
    parentBlockExternalId,
    parentBlockIndex,
    hidePlaceholder,
    onInsert,
    onRemove,
    showPlaceholder,
  });

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
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
    </Box>
  );
};
