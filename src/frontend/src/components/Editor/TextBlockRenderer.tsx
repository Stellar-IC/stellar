import { Box } from '@mantine/core';

import { Block } from '@/types';

import { TextBlock } from './TextBlock';
import { TextBlockBlockType } from './TextBlock/types';

interface TextBlockRendererProps {
  block: Block;
  index: number;
  parentBlockIndex?: number;
  placeholder?: string;
  blockType: TextBlockBlockType;
}

export const TextBlockRenderer = ({
  block,
  blockType,
  index,
  parentBlockIndex,
  placeholder,
}: TextBlockRendererProps) => (
  <Box>
    <TextBlock
      blockIndex={index}
      blockType={blockType}
      blockExternalId={block.uuid}
      parentBlockExternalId={block.parent}
      parentBlockIndex={parentBlockIndex}
      placeholder={placeholder}
      value={block.properties.title}
    />
  </Box>
);
