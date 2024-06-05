import { Anchor, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
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
  const { workspaceId } = useWorkspaceContext();

  return (
    <Box>
      <Anchor
        component={Link}
        to={`/spaces/${workspaceId}/pages/${block.uuid}`}
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
