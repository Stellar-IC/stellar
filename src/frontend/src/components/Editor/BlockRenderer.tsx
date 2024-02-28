import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Box, Flex, MantineTheme, Text } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { getNodeAtPosition } from '@stellar-ic/lseq-ts/Tree';
import { IconBulbFilled } from '@tabler/icons-react';
import { useCallback } from 'react';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { Block } from '@/types';

import { BlockWithActions } from './BlockWithActions';
import { BulletedListBlockRenderer } from './BulletedListBlockRenderer';
import { NumberedListBlockRenderer } from './NumberedListBlockRenderer';
import { PageBlockRenderer } from './PageBlockRenderer';
import { TextBlockRenderer } from './TextBlockRenderer';
import { TodoListBlockRenderer } from './TodoListBlockRenderer';

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
  const nestedBlockIds = Tree.toArray(block.content);

  if (nestedBlockIds.length === 0) return null;

  return (
    <Box pos="relative" w="100%" pt="0.25rem">
      {nestedBlockIds.map((externalId, i) => (
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
  numeral?: number;
}

const BlockRendererInner = ({
  externalId,
  index,
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
    return (
      <PageBlockRenderer
        key={block.uuid}
        blockExternalId={block.uuid}
        index={index}
        placeholder={placeholder}
        parentBlockIndex={parentBlockIndex}
        blockType={block.blockType}
      />
    );
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
    return (
      <TodoListBlockRenderer
        blockExternalId={block.uuid}
        index={index}
        parentBlockIndex={parentBlockIndex}
      />
    );
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
  const { getSettingValue } = useSettingsContext();
  const block = get<Block>('block', externalId);
  const parentBlock = parentBlockExternalId
    ? get<Block>(DATA_TYPES.block, parentBlockExternalId)
    : undefined;

  const getPeviousSiblingBlockExternalId = useCallback(
    (currentBlockIndex: number) => {
      if (currentBlockIndex === 0) return undefined;
      if (!parentBlock) return undefined;

      const previousSiblingNode = getNodeAtPosition(
        parentBlock.content,
        currentBlockIndex - 1
      );

      return previousSiblingNode?.value;
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
        throw new Error('Block is not a numberedList block');
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

    if (!block) {
      throw new Error('Block is not set');
    }

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

  const getStyle = (theme: MantineTheme) => ({
    paddingLeft: `calc(${depth} * ${theme.spacing.lg})`,
  });

  return (
    <Box className="FocusableBlock" mb="0.25rem">
      <BlockWithActions
        key={block.uuid}
        blockExternalId={externalId}
        blockIndex={index}
        blockType={block.blockType}
        parentBlockExternalId={parentBlockExternalId}
        dragHandleProps={dragHandleProps}
      >
        <Box style={getStyle}>
          <BlockRendererInner
            index={index}
            parentBlockIndex={parentBlockIndex}
            placeholder={placeholder}
            externalId={externalId}
            numeral={calculateBlockNumeral()}
          />
          {getSettingValue('developer.showBlockIds') && (
            <Text
              size="xs"
              c="gray.7"
              onClick={() => {
                navigator.clipboard.writeText(externalId);
              }}
              style={{ cursor: 'pointer' }}
            >
              {externalId}
            </Text>
          )}
        </Box>
      </BlockWithActions>
      {!('page' in block.blockType) && (
        <NestedBlocks
          blockExternalId={block.uuid}
          depth={depth + 1}
          parentBlockIndex={index}
        />
      )}
    </Box>
  );
};
