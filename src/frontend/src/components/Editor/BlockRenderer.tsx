import { Box, Flex, MantineTheme, rem, Text } from '@mantine/core';
import { IconBulbFilled } from '@tabler/icons-react';
import { memo, useCallback, useEffect, useState } from 'react';

import { useSettingsContext } from '@/contexts/SettingsContext';
import { db } from '@/db';
import * as BlockModule from '@/modules/blocks';
import { store, useStoreQuery } from '@/modules/data-store';
import { Tree } from '@/modules/lseq';
import { getNodeAtPosition } from '@/modules/lseq/tree';
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
}

const NestedBlocks = ({ depth, blockExternalId }: NestedBlocksProps) => {
  const block = useStoreQuery(() => store.blocks.get(blockExternalId), {
    clone: BlockModule.clone,
  });

  if (!block) return null;

  const nestedBlockIds = Tree.toArray(block.content);

  if (nestedBlockIds.length === 0) return null;

  return (
    <Box pos="relative" w="100%">
      {nestedBlockIds.map((externalId, i) => (
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

interface BlockRendererInnerProps {
  externalId: string;
  index: number;
  placeholder?: string;
  numeral?: number;
}

const BlockRendererInner = ({
  externalId,
  index,
  placeholder,
  numeral,
}: BlockRendererInnerProps) => {
  const block = useStoreQuery(() => store.blocks.get(externalId), {
    clone: BlockModule.clone,
  });

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
    return <TodoListBlock block={block} index={index} />;
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
  placeholder?: string;
  depth: number;
}

export const _BlockRenderer = ({
  externalId,
  index,
  depth,
  parentBlockExternalId,
  placeholder,
}: BlockRendererProps) => {
  const [blockNumeral, setBlockNumeral] = useState<number | undefined>(
    undefined
  );
  const { getSettingValue } = useSettingsContext();
  const block = useStoreQuery(() => store.blocks.get(externalId), {
    clone: BlockModule.clone,
  });

  const parentBlock = useStoreQuery(
    () => {
      if (!parentBlockExternalId) return null;
      return store.blocks.get(parentBlockExternalId);
    },
    { clone: BlockModule.clone }
  );

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
    <Box className="FocusableBlock" data-blockid={block.uuid}>
      <BlockWithActions
        key={block.uuid}
        blockExternalId={externalId}
        blockIndex={index}
        blockType={block.blockType}
        parentBlockExternalId={parentBlockExternalId}
      >
        <Box style={getStyle} py={rem(3)}>
          <BlockRendererInner
            index={index}
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
        <NestedBlocks blockExternalId={block.uuid} depth={depth + 1} />
      )}
    </Box>
  );
};

export const BlockRenderer = memo(_BlockRenderer);
