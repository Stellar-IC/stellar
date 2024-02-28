import { Box } from '@mantine/core';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { Block } from '@/types';
import { TextBlock } from './TextBlock';
import { TextBlockBlockType } from './TextBlock/types';

interface TextBlockRendererProps {
  blockExternalId: string;
  index: number;
  parentBlockIndex?: number;
  placeholder?: string;
  blockType: TextBlockBlockType;
}

export const TextBlockRenderer = ({
  blockExternalId,
  blockType,
  index,
  parentBlockIndex,
  placeholder,
}: TextBlockRendererProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', blockExternalId);
  const parentExternalId = block?.parent;

  if (!block) return <div />;

  return (
    <Box>
      <TextBlock
        blockIndex={index}
        blockType={blockType}
        blockExternalId={blockExternalId}
        parentBlockExternalId={parentExternalId}
        parentBlockIndex={parentBlockIndex}
        placeholder={placeholder}
        value={block.properties.title}
      />
    </Box>
  );
};
