import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
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
  parentBlockExternalId?: string;
  placeholder?: string;
  depth: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const BlockRenderer = ({
  externalId,
  index,
  depth,
  dragHandleProps,
  parentBlockExternalId,
  placeholder,
}: BlockRendererProps) => {
  const {
    blocks: { data, query },
  } = usePagesContext();
  const block = useMemo(() => data[externalId], [data, externalId]);

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  if (!block) {
    return (
      <BlockWithActions
        key={externalId}
        blockIndex={index}
        blockExternalId={externalId}
        parentBlockExternalId={parentBlockExternalId}
        dragHandleProps={dragHandleProps}
      >
        <div />
      </BlockWithActions>
    );
  }

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
        <BlockWithActions
          key={block.uuid}
          blockExternalId={externalId}
          blockIndex={index}
          parentBlockExternalId={parentBlockExternalId}
          dragHandleProps={dragHandleProps}
        >
          <TextBlockRenderer
            key={block.uuid}
            blockExternalId={block.uuid}
            index={index}
            depth={depth}
            placeholder={placeholder}
            blockType={block.blockType}
          />
        </BlockWithActions>
        <NestedBlocks
          blockExternalId={block.uuid}
          depth={depth + 1}
        />
      </>
    );
  }

  if ('bulletedList' in block.blockType) {
    return (
      <>
        <BlockWithActions
          key={block.uuid}
          blockExternalId={externalId}
          blockIndex={index}
          parentBlockExternalId={parentBlockExternalId}
          dragHandleProps={dragHandleProps}
        >
          <BulletedListBlockRenderer
            blockExternalId={block.uuid}
            index={index}
          />
        </BlockWithActions>
        <NestedBlocks
          blockExternalId={block.uuid}
          depth={depth + 1}
        />
      </>
    );
  }

  if ('todoList' in block.blockType) {
    return (
      <>
        <BlockWithActions
          key={block.uuid}
          blockExternalId={externalId}
          blockIndex={index}
          parentBlockExternalId={parentBlockExternalId}
          dragHandleProps={dragHandleProps}
        >
          <TodoListBlockRenderer blockExternalId={block.uuid} index={index} />
        </BlockWithActions>
        <NestedBlocks
          blockExternalId={block.uuid}
          depth={depth + 1}
        />
      </>
    );
  }

  return (
    <BlockWithActions
      key={block.uuid}
      blockExternalId={externalId}
      blockIndex={index}
      parentBlockExternalId={parentBlockExternalId}
      dragHandleProps={dragHandleProps}
    >
      Unknown Block Type
    </BlockWithActions>
  );
};
