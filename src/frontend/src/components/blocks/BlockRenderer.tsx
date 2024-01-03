import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Box, Flex } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback } from 'react';

import { IconBulbFilled } from '@tabler/icons-react';
import { getNodeAtPosition } from '@stellar-ic/lseq-ts/Tree';
import { Block } from '@/types';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { DATA_TYPES } from '@/constants';
import { BlockWithActions } from './BlockWithActions';
import { BulletedListBlockRenderer } from './BulletedListBlockRenderer';
import { TextBlockRenderer } from './TextBlockRenderer';
import { TodoListBlockRenderer } from './TodoListBlockRenderer';
import { NumberedListBlockRenderer } from './NumberedListBlockRenderer';

interface NestedBlocksProps {
  blockExternalId: string;
  depth: number;
  parentBlockIndex: number;
}

const NestedBlocks = ({
  depth,
  blockExternalId,
  parentBlockIndex,
}: NestedBlocksProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', blockExternalId);

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
            parentBlockIndex={parentBlockIndex}
          />
        </Box>
      ))}
    </Box>
  );
};

interface BlockRendererInnerProps {
  externalId: string;
  index: number;
  parentBlockIndex?: number;
  placeholder?: string;
  depth: number;
  numeral?: number;
}

const BlockRendererInner = ({
  externalId,
  index,
  depth,
  parentBlockIndex,
  placeholder,
  numeral,
}: BlockRendererInnerProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', externalId);

  if (!block) {
    return null;
  }

  if ('page' in block.blockType) {
    return null;
  }

  if (
    'heading1' in block.blockType ||
    'heading2' in block.blockType ||
    'heading3' in block.blockType ||
    'paragraph' in block.blockType
  ) {
    return (
      <TextBlockRenderer
        key={block.uuid}
        blockExternalId={block.uuid}
        index={index}
        depth={depth}
        placeholder={placeholder}
        parentBlockIndex={parentBlockIndex}
        blockType={block.blockType}
      />
    );
  }

  if ('quote' in block.blockType) {
    return (
      <div style={{ borderLeft: '2px solid #ddd', paddingLeft: '1rem' }}>
        <TextBlockRenderer
          key={block.uuid}
          blockExternalId={block.uuid}
          index={index}
          depth={depth}
          placeholder={placeholder}
          parentBlockIndex={parentBlockIndex}
          blockType={block.blockType}
        />
      </div>
    );
  }

  if ('callout' in block.blockType) {
    return (
      <Flex p="md" bg="dark" style={{ borderRadius: '0.25rem' }} gap="md">
        <IconBulbFilled size={24} d="inline-block" />
        <TextBlockRenderer
          key={block.uuid}
          blockExternalId={block.uuid}
          index={index}
          depth={depth}
          placeholder={placeholder}
          parentBlockIndex={parentBlockIndex}
          blockType={block.blockType}
        />
      </Flex>
    );
  }

  if ('bulletedList' in block.blockType) {
    return (
      <BulletedListBlockRenderer blockExternalId={block.uuid} index={index} />
    );
  }

  if ('todoList' in block.blockType) {
    return <TodoListBlockRenderer blockExternalId={block.uuid} index={index} />;
  }

  if ('numberedList' in block.blockType) {
    return (
      <NumberedListBlockRenderer
        blockExternalId={block.uuid}
        index={index}
        numeral={numeral || 0}
      />
    );
  }

  if ('code' in block.blockType) {
    return (
      <Box p="lg" bg="dark" style={{ borderRadius: '0.25rem' }}>
        <pre>
          <TextBlockRenderer
            key={block.uuid}
            blockExternalId={block.uuid}
            index={index}
            depth={depth}
            placeholder={placeholder}
            parentBlockIndex={parentBlockIndex}
            blockType={block.blockType}
          />
        </pre>
      </Box>
    );
  }

  return <>Unknown Block Type</>;
};

interface BlockRendererProps {
  externalId: string;
  index: number;
  parentBlockExternalId?: string;
  parentBlockIndex?: number;
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
  parentBlockIndex,
  placeholder,
}: BlockRendererProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', externalId);
  const parentBlock = parentBlockExternalId
    ? get<Block>(DATA_TYPES.block, parentBlockExternalId)
    : undefined;

  const getPeviousSiblingBlockExternalId = useCallback(
    (currentBlockIndex: number) => {
      if (currentBlockIndex === 0) return undefined;
      if (!parentBlock) return undefined;

      try {
        const previousSinblingNode = getNodeAtPosition(
          parentBlock.content,
          currentBlockIndex - 1
        );

        return previousSinblingNode.value;
      } catch (e) {
        // Previous sibling node does not exist
        return undefined;
      }
    },
    [parentBlock]
  );

  const calculateBlockNumeral = useCallback(() => {
    const doTheThing = (
      _block: Block,
      currentBlockIndex: number,
      numeral = 0
    ): number | undefined => {
      if (!('numberedList' in _block.blockType)) {
        return;
      }

      const previousSiblingBlockExternalId =
        getPeviousSiblingBlockExternalId(currentBlockIndex);
      if (!previousSiblingBlockExternalId) {
        return numeral + 1;
      }

      const previousSiblingBlock = get<Block>(
        DATA_TYPES.block,
        previousSiblingBlockExternalId
      );
      if (
        !previousSiblingBlock ||
        !('numberedList' in previousSiblingBlock.blockType)
      ) {
        return numeral + 1;
      }

      return doTheThing(
        previousSiblingBlock,
        currentBlockIndex - 1,
        numeral + 1
      );
    };

    if (!block) return;

    return doTheThing(block, index);
  }, [block, get, getPeviousSiblingBlockExternalId, index]);

  if (!block) {
    return (
      <BlockWithActions
        key={externalId}
        blockIndex={index}
        blockExternalId={externalId}
        blockType={{ paragraph: null }}
        parentBlockExternalId={parentBlockExternalId}
        dragHandleProps={dragHandleProps}
      >
        <div />
      </BlockWithActions>
    );
  }

  return (
    <>
      <BlockWithActions
        key={block.uuid}
        blockExternalId={externalId}
        blockIndex={index}
        blockType={block.blockType}
        parentBlockExternalId={parentBlockExternalId}
        dragHandleProps={dragHandleProps}
      >
        <BlockRendererInner
          depth={depth}
          index={index}
          parentBlockIndex={parentBlockIndex}
          placeholder={placeholder}
          externalId={externalId}
          numeral={calculateBlockNumeral()}
        />
      </BlockWithActions>
      <NestedBlocks
        blockExternalId={block.uuid}
        depth={depth + 1}
        parentBlockIndex={index}
      />
    </>
  );
};
