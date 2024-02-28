import { Anchor, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { Block } from '@/types';

import { TextBlock } from './TextBlock';

interface PageBlockRendererProps {
  blockExternalId: string;
  index: number;
  parentBlockIndex?: number;
  placeholder?: string;
  blockType: { page: null };
}

export const PageBlockRenderer = ({
  blockExternalId,
  blockType,
  index,
  parentBlockIndex,
  placeholder,
}: PageBlockRendererProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', blockExternalId);
  const parentExternalId = block?.parent;

  if (!block) return <div />;

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
          blockExternalId={blockExternalId}
          parentBlockExternalId={parentExternalId}
          parentBlockIndex={parentBlockIndex}
          placeholder={placeholder}
          value={block.properties.title}
        />
      </Anchor>
    </Box>
  );
};
