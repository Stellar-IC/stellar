import { Anchor, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

import { Block } from '@/types';

import { TextBlock } from './TextBlock';

interface PageBlockRendererProps {
  block: Block;
  index: number;
  placeholder?: string;
  blockType: { page: null };
}

export const PageBlockRenderer = ({
  block,
  blockType,
  index,
  placeholder,
}: PageBlockRendererProps) => {
  const parentExternalId = block.parent;

  return (
    <Box>
      <Anchor
        component={Link}
        to={`/pages/${block.uuid}`}
        style={{ color: 'inherit' }}
      >
        <TextBlock
          blockIndex={index}
          blockType={blockType}
          blockExternalId={block.uuid}
          parentBlockExternalId={parentExternalId}
          placeholder={placeholder}
          value={block.properties.title}
        />
      </Anchor>
    </Box>
  );
};
