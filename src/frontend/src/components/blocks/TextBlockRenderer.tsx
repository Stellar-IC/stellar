import { Box, MantineTheme, Text } from '@mantine/core';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';
import { BlockWithActions } from './BlockWithActions';

import { TextBlock } from './TextBlock';
import { TextBlockBlockType } from './TextBlock/types';

interface BlockRendererProps {
  blockExternalId: string;
  index: number;
  placeholder?: string;
  depth: number;
  blockType: TextBlockBlockType;
}

export const TextBlockRenderer = ({
  blockExternalId,
  blockType,
  depth,
  index,
  placeholder,
}: BlockRendererProps) => {
  const {
    blocks: { data },
  } = usePagesContext();
  const block = data[blockExternalId];
  const parentExternalId = block?.parent;

  const getStyle = (theme: MantineTheme) => ({
    paddingLeft: `calc(${depth} * ${theme.spacing.lg})`,
  });

  if (!block) return <div />;

  const { onEnterPressed, onCharacterInserted, onCharacterRemoved } =
    useTextBlockEventHandlers({
      blockExternalId,
      index,
    });

  return (
    <BlockWithActions key={blockExternalId} blockIndex={index} block={block}>
      <Box style={getStyle}>
        <TextBlock
          blockIndex={index}
          blockType={blockType}
          blockExternalId={blockExternalId}
          onEnterPressed={onEnterPressed}
          onInsert={onCharacterInserted}
          onRemove={onCharacterRemoved}
          parentBlockExternalId={parentExternalId}
          placeholder={placeholder}
          value={block.properties.title}
        />
        <Text size="xs" c="gray.7">
          {blockExternalId}
        </Text>
      </Box>
    </BlockWithActions>
  );
};
