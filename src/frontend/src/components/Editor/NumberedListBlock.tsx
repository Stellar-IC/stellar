import { Box, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Tree } from '@stellar-ic/lseq-ts';
import { createRef, useEffect, useMemo, useState } from 'react';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useTextBlockKeyboardEventHandlers } from '@/hooks/documents/useTextBlockKeyboardEventHandlers';
import { Block, ExternalId } from '@/types';

import { useTextStyles } from './TextBlock/hooks/useTextStyles';

export type NumberedListBlockInnerProps = {
  blockIndex: number;
  blockType: { numberedList: null };
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  placeholder?: string;
  value: Tree.Tree;
};

const NumberedListBlockInner = ({
  blockIndex,
  parentBlockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  placeholder,
  value,
}: NumberedListBlockInnerProps) => {
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
    showPlaceholder,
    hidePlaceholder,
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

interface NumberedListBlockProps {
  externalId: string;
  index: number;
  numeral: number;
}

export const NumberedListBlock = ({
  externalId,
  index,
  numeral,
}: NumberedListBlockProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', externalId);

  if (!block) return null;
  if (!('numberedList' in block.blockType)) {
    throw new Error('Expected numbered list block');
  }

  const parentExternalId = block.parent;

  return (
    <Flex>
      <Box mx="sm">{numeral}.</Box>
      <NumberedListBlockInner
        blockExternalId={block.uuid}
        blockIndex={index}
        parentBlockExternalId={parentExternalId}
        value={block.properties.title}
        blockType={block.blockType}
      />
    </Flex>
  );
};
