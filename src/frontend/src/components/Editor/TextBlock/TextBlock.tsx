import { Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Tree } from '@stellar-ic/lseq-ts';
import { createRef, memo, useEffect, useMemo, useState } from 'react';
import { useErrorBoundary } from 'react-error-boundary';

import { useTextBlockKeyboardEventHandlers } from '@/hooks/documents/useTextBlockKeyboardEventHandlers';

import { useTextStyles } from './hooks/useTextStyles';
import { TextBlockProps } from './types';

const _TextBlock = ({
  blockIndex,
  parentBlockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  placeholder,
  value,
}: TextBlockProps) => {
  const [initialText, setInitialText] = useState(Tree.toText(value));
  const [initialBlockExternalId, setInitialBlockExternalId] =
    useState(blockExternalId);

  const [
    isShowingPlaceholder,
    { close: hidePlaceholder, open: showPlaceholder },
  ] = useDisclosure(!initialText);

  const textBoxRef = useMemo(() => createRef<HTMLSpanElement>(), []);
  const textStyles = useTextStyles({ blockType });

  useEffect(() => {
    if (initialBlockExternalId !== blockExternalId) {
      const newInitialText = Tree.toText(value);
      if (newInitialText.length === 0) {
        showPlaceholder();
      }

      setInitialText(newInitialText);
      setInitialBlockExternalId(blockExternalId);
    }
  }, [blockExternalId, initialBlockExternalId, value, showPlaceholder]);

  useEffect(() => {
    if (!textBoxRef.current) return;
    const newText = Tree.toText(value);
    textBoxRef.current.innerText = newText;
    if (newText.length > 0) {
      hidePlaceholder();
    }
  }, [initialText, textBoxRef, value, hidePlaceholder]);

  const { showBoundary } = useErrorBoundary();

  const { onKeyDown, onCut, onPaste } = useTextBlockKeyboardEventHandlers({
    blockExternalId,
    blockIndex,
    blockType,
    parentBlockExternalId,
    parentBlockIndex,
    hidePlaceholder,
    showPlaceholder,
    onError: (error) => {
      showBoundary(error);
    },
  });

  return (
    <Box className="TextBlock" pos="relative" w="100%" style={textStyles}>
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
          try {
            onKeyDown(e);
          } catch (e) {
            showBoundary(e);
          }
        }}
        onPaste={onPaste}
        onCut={onCut}
      />
    </Box>
  );
};

export const TextBlock = memo(_TextBlock, (prev, next) => {
  if (prev.blockExternalId !== next.blockExternalId) return false;
  if (prev.blockIndex !== next.blockIndex) return false;

  if (Object.keys(prev.blockType)[0] !== Object.keys(next.blockType)[0]) {
    return false;
  }

  if (prev.parentBlockIndex !== next.parentBlockIndex) return false;
  if (prev.parentBlockExternalId !== next.parentBlockExternalId) return false;
  if (prev.placeholder !== next.placeholder) return false;

  return true;
});
