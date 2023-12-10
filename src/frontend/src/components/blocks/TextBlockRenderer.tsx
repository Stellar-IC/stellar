import { Box, MantineTheme, Text } from '@mantine/core';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';

import { TextBlock } from './TextBlock';
import { TextBlockBlockType } from './TextBlock/types';

interface TextBlockRendererProps {
  blockExternalId: string;
  index: number;
  parentBlockIndex?: number;
  placeholder?: string;
  depth: number;
  blockType: TextBlockBlockType;
}

export const TextBlockRenderer = ({
  blockExternalId,
  blockType,
  depth,
  index,
  parentBlockIndex,
  placeholder,
}: TextBlockRendererProps) => {
  const {
    blocks: { data },
  } = usePagesContext();
  const block = data[blockExternalId];
  const parentExternalId = block?.parent;

  const getStyle = (theme: MantineTheme) => ({
    paddingLeft: `calc(${depth} * ${theme.spacing.lg})`,
  });

  if (!block) return <div />;

  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId }
  );

  return (
    <Box style={getStyle}>
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
      <Text size="xs" c="gray.7">
        {blockExternalId}
      </Text>
    </Box>
  );
};
