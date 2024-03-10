import { Box, Flex, MantineTheme, Text } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { getNodeAtPosition } from '@stellar-ic/lseq-ts/Tree';
import { IconBulbFilled } from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { memo, useCallback, useEffect, useState } from 'react';

import { useSettingsContext } from '@/contexts/SettingsContext';
import { db } from '@/db';
import { Block } from '@/types';

import { BlockWithActions } from './BlockWithActions';
import { BulletedListBlock } from './BulletedListBlock';
import { NumberedListBlock } from './NumberedListBlock';
import { PageBlockRenderer } from './PageBlockRenderer';
import { TextBlock } from './TextBlock';
import { TodoListBlock } from './TodoListBlock';

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
  const block = useLiveQuery(() => db.blocks.get(blockExternalId));

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
  const block = useLiveQuery(() => db.blocks.get(externalId));

  if (!block) {
    return null;
  }

  if ('page' in block.blockType) {
    return (
      <PageBlockRenderer
        key={block.uuid}
        block={block}
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
      <TextBlock
        key={block.uuid}
        blockExternalId={block.uuid}
        blockIndex={index}
        blockType={block.blockType}
        parentBlockExternalId={block.parent}
        parentBlockIndex={parentBlockIndex}
        placeholder={placeholder}
        value={block.properties.title}
      />
    );
  }

  if ('quote' in block.blockType) {
    return (
      <div style={{ borderLeft: '2px solid #ddd', paddingLeft: '1rem' }}>
        <TextBlock
          key={block.uuid}
          blockExternalId={block.uuid}
          blockIndex={index}
          blockType={block.blockType}
          placeholder={placeholder}
          parentBlockExternalId={block.parent}
          parentBlockIndex={parentBlockIndex}
          value={block.properties.title}
        />
      </div>
    );
  }

  if ('callout' in block.blockType) {
    return (
      <Flex p="md" bg="dark" style={{ borderRadius: '0.25rem' }} gap="md">
        <IconBulbFilled size={24} d="inline-block" />
        <TextBlock
          key={block.uuid}
          blockExternalId={block.uuid}
          blockIndex={index}
          blockType={block.blockType}
          parentBlockExternalId={block.parent}
          parentBlockIndex={parentBlockIndex}
          placeholder={placeholder}
          value={block.properties.title}
        />
      </Flex>
    );
  }

  if ('bulletedList' in block.blockType) {
    return <BulletedListBlock block={block} index={index} />;
  }

  if ('todoList' in block.blockType) {
    return (
      <TodoListBlock
        block={block}
        index={index}
        parentBlockIndex={parentBlockIndex}
      />
    );
  }

  if ('numberedList' in block.blockType) {
    return (
      <NumberedListBlock block={block} index={index} numeral={numeral || 0} />
    );
  }

  if ('code' in block.blockType) {
    return (
      <Box p="lg" bg="dark" style={{ borderRadius: '0.25rem' }}>
        <pre>
          <TextBlock
            key={block.uuid}
            blockExternalId={block.uuid}
            blockIndex={index}
            blockType={block.blockType}
            parentBlockExternalId={block.parent}
            parentBlockIndex={parentBlockIndex}
            placeholder={placeholder}
            value={block.properties.title}
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
}

export const _BlockRenderer = ({
  externalId,
  index,
  depth,
  parentBlockExternalId,
  parentBlockIndex,
  placeholder,
}: BlockRendererProps) => {
  const [blockNumeral, setBlockNumeral] = useState<number | undefined>(
    undefined
  );
  const { getSettingValue } = useSettingsContext();
  const block = useLiveQuery(() => db.blocks.get(externalId));
  const parentBlock = useLiveQuery(() => {
    if (!parentBlockExternalId) return undefined;
    return db.blocks.get(parentBlockExternalId);
  });

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
    const _calculateNumeral = async (
      _block: Block,
      currentBlockIndex: number,
      numeral = 0
    ): Promise<number | undefined> => {
      if (!('numberedList' in _block.blockType)) {
        throw new Error('Block is not a numberedList block');
      }

      const previousSiblingBlockExternalId =
        getPeviousSiblingBlockExternalId(currentBlockIndex);
      if (!previousSiblingBlockExternalId) {
        return numeral + 1;
      }

      const previousSiblingBlock = await db.blocks.get(
        previousSiblingBlockExternalId
      );

      if (
        !previousSiblingBlock ||
        !('numberedList' in previousSiblingBlock.blockType)
      ) {
        return numeral + 1;
      }

      return _calculateNumeral(
        previousSiblingBlock,
        currentBlockIndex - 1,
        numeral + 1
      );
    };

    if (!block) {
      throw new Error('Block is not set');
    }

    return _calculateNumeral(block, index);
  }, [block, getPeviousSiblingBlockExternalId, index]);

  useEffect(() => {
    if (!block || !('numberedList' in block.blockType)) return;
    calculateBlockNumeral().then(setBlockNumeral);
  }, [block, calculateBlockNumeral]);

  if (!block) {
    return (
      <BlockWithActions
        key={externalId}
        blockIndex={index}
        blockExternalId={externalId}
        blockType={{ paragraph: null }}
        parentBlockExternalId={parentBlockExternalId}
      >
        <div />
      </BlockWithActions>
    );
  }

  const getStyle = (theme: MantineTheme) => ({
    paddingLeft: `calc(${depth} * ${theme.spacing.lg})`,
  });

  return (
    <Box className="FocusableBlock" data-id={block.uuid} mb="0.25rem">
      <BlockWithActions
        key={block.uuid}
        blockExternalId={externalId}
        blockIndex={index}
        blockType={block.blockType}
        parentBlockExternalId={parentBlockExternalId}
      >
        <Box style={getStyle}>
          <BlockRendererInner
            index={index}
            parentBlockIndex={parentBlockIndex}
            placeholder={placeholder}
            externalId={externalId}
            numeral={blockNumeral}
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

export const BlockRenderer = memo(_BlockRenderer);
