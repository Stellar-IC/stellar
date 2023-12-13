import { Box, Flex } from '@mantine/core';
import { createRef, useEffect, useMemo, useState } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { Tree } from '@stellar-ic/lseq-ts';
import { useDisclosure } from '@mantine/hooks';
import { ExternalId } from '@/types';
import { useTextBlockKeyboardEventHandlers } from '@/hooks/documents/useTextBlockKeyboardEventHandlers';
import { useTextStyles } from './TextBlock/hooks/useTextStyles';

export type NumberedListBlockInnerProps = {
  blockIndex: number;
  blockType: { numberedList: null };
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  placeholder?: string;
  value: Tree.Tree;
  onInsert: (cursorPosition: number, character: string) => void;
  onRemove: (cursorPosition: number) => void;
};

const NumberedListBlockInner = ({
  blockIndex,
  parentBlockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  placeholder,
  value,
  onInsert,
  onRemove,
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
    onInsert,
    onRemove,
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
  onCharacterInserted: (cursorPosition: number, character: string) => void;
  onCharacterRemoved: (cursorPosition: number) => void;
  numeral: number;
}

export const NumberedListBlock = ({
  externalId,
  index,
  numeral,
  onCharacterInserted,
  onCharacterRemoved,
}: NumberedListBlockProps) => {
  const {
    blocks: { data, query },
  } = usePagesContext();
  const block = useMemo(() => data[externalId], [data, externalId]);

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const parentExternalId = block?.parent;

  if (!block) return <div />;
  if (!('numberedList' in block.blockType)) {
    throw new Error('Expected numbered list block');
  }

  return (
    <Flex>
      <Box mx="sm">{numeral}.</Box>
      <NumberedListBlockInner
        blockExternalId={block.uuid}
        blockIndex={index}
        parentBlockExternalId={parentExternalId}
        value={block.properties.title}
        blockType={block.blockType}
        onInsert={onCharacterInserted}
        onRemove={onCharacterRemoved}
      />
    </Flex>
  );
};
