import { Box, Text } from '@mantine/core';

import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { Block } from '@/types';
import { Link } from 'react-router-dom';
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

  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId }
  );

  return (
    <Box>
      <Link to={`/pages/${block.uuid}`}>
        <TextBlock
          blockIndex={index}
          blockType={blockType}
          blockExternalId={blockExternalId}
          onInsert={onCharacterInserted}
          onRemove={onCharacterRemoved}
          parentBlockExternalId={parentExternalId}
          parentBlockIndex={parentBlockIndex}
          placeholder={placeholder}
          value={block.properties.title}
        />
      </Link>
      <Text size="xs" c="gray.7">
        {blockExternalId}
      </Text>
    </Box>
  );
};
