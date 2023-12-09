import { Box } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { BlockWithActions } from './BlockWithActions';
import { BulletedListBlockRenderer } from './BulletedListBlockRenderer';
import { TextBlockRenderer } from './TextBlockRenderer';
import { TodoListBlockRenderer } from './TodoListBlockRenderer';

interface NestedBlocksProps {
  blockExternalId: string;
  depth: number;
}

const NestedBlocks = ({ depth, blockExternalId }: NestedBlocksProps) => {
  const {
    blocks: { data: blocks },
  } = usePagesContext();

  const block = useMemo(
    () => blocks[blockExternalId],
    [blocks, blockExternalId]
  );

  if (!block) return null;

  return (
    <Box pos="relative" w="100%">
      {Tree.toArray(block.content).map((externalId, i) => (
        <Box key={externalId}>
          {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
          <BlockRenderer
            key={externalId}
            externalId={externalId}
            index={i}
            depth={depth}
          />
        </Box>
      ))}
    </Box>
  );
};

interface BlockRendererProps {
  externalId: string;
  index: number;
  placeholder?: string;
  depth: number;
}

export const BlockRenderer = ({
  externalId,
  index,
  depth,
  placeholder,
}: BlockRendererProps) => {
  const {
    blocks: { data, query },
  } = usePagesContext();
  const block = useMemo(() => data[externalId], [data, externalId]);

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  if (!block) return <div />;

  if ('page' in block.blockType) {
    return (
      <Box ml="112px" mb="1rem" w="100%">
        {/* <HeadingBlock key={String(block.uuid)} block={block} /> */}
      </Box>
    );
  }

  if (
    'heading1' in block.blockType ||
    'heading2' in block.blockType ||
    'heading3' in block.blockType ||
    'paragraph' in block.blockType
  ) {
    return (
      <>
        <TextBlockRenderer
          key={block.uuid}
          blockExternalId={block.uuid}
          index={index}
          depth={depth}
          placeholder={placeholder}
          blockType={block.blockType}
        />
        <NestedBlocks blockExternalId={block.uuid} depth={depth + 1} />
      </>
    );
  }

  if ('bulletedList' in block.blockType) {
    return (
      <>
        <BulletedListBlockRenderer blockExternalId={block.uuid} index={index} />
        <NestedBlocks blockExternalId={block.uuid} depth={depth + 1} />
      </>
    );
  }

  if ('todoList' in block.blockType) {
    return (
      <>
        <TodoListBlockRenderer blockExternalId={block.uuid} index={index} />
        <NestedBlocks blockExternalId={block.uuid} depth={depth + 1} />
      </>
    );
  }

  return (
    <BlockWithActions key={block.uuid} blockIndex={index} block={block}>
      Unknown Block Type
    </BlockWithActions>
  );
};
