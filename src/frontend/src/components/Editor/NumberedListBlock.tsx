import { Box, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { createRef, useEffect, useMemo, useState } from 'react';

import { useEditorSave } from '@/hooks/editor/useEditorSave';
import { useEditorEventHandlers } from '@/modules/editor/hooks/useEditorEventHandlers';
import { Tree } from '@/modules/lseq';
import { Block, ExternalId } from '@/types';

import { useTextStyles } from './TextBlock/hooks/useTextStyles';

export type NumberedListBlockInnerProps = {
  blockIndex: number;
  blockType: { numberedList: null };
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
  placeholder?: string;
  value: Tree.Tree;
};

const NumberedListBlockInner = ({
  blockIndex,
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

  const onSave = useEditorSave();
  const { onKeyDown, onPaste } = useEditorEventHandlers({
    blockExternalId,
    blockIndex,
    blockType,
    parentBlockExternalId,
    showPlaceholder,
    hidePlaceholder,
    onSave,
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
  block: Block;
  index: number;
  numeral: number;
}

export const NumberedListBlock = ({
  block,
  index,
  numeral,
}: NumberedListBlockProps) => {
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
