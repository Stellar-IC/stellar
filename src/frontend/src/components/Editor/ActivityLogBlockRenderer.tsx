import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Anchor, Box, Checkbox, Flex, MantineTheme, Text } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { getNodeAtPosition } from '@stellar-ic/lseq-ts/Tree';
import { IconBulbFilled } from '@tabler/icons-react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

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

interface BlockRendererInnerProps {
  // externalId: string;
  // index: number;
  // parentBlockIndex?: number;
  // placeholder?: string;
  // numeral?: number;
  block: Block;
}

const BlockRendererInner = ({
  // externalId,
  // index,
  // parentBlockIndex,
  // placeholder,
  // numeral,
  block,
}: BlockRendererInnerProps) => {
  if ('page' in block.blockType) {
    return (
      <Box>
        <Anchor
          component={Link}
          to={`/pages/${block.uuid}`}
          style={{ color: 'inherit' }}
        >
          <Box
            className="TextBlock"
            pos="relative"
            w="100%"
            // style={{ ...textStyles }}
          >
            {Tree.toText(block.properties.title)}
          </Box>
        </Anchor>
      </Box>
    );
  }

  if (
    'heading1' in block.blockType ||
    'heading2' in block.blockType ||
    'heading3' in block.blockType ||
    'paragraph' in block.blockType
  ) {
    return <Text>{Tree.toText(block.properties.title)}</Text>;
  }

  if ('quote' in block.blockType) {
    return (
      <div style={{ borderLeft: '2px solid #ddd', paddingLeft: '1rem' }}>
        <Text>{Tree.toText(block.properties.title)}</Text>;
      </div>
    );
  }

  if ('callout' in block.blockType) {
    return (
      <Flex p="md" bg="dark" style={{ borderRadius: '0.25rem' }} gap="md">
        <IconBulbFilled size={24} d="inline-block" />
        <Text>{Tree.toText(block.properties.title)}</Text>;
      </Flex>
    );
  }

  if ('bulletedList' in block.blockType) {
    return (
      <Flex>
        <div
          style={{
            width: '0.5rem',
            height: '0.5rem',
            backgroundColor: '#333',
            borderRadius: '0.5rem',
            alignSelf: 'center',
            margin: '0 1rem',
          }}
        />
        <Text>{Tree.toText(block.properties.title)}</Text>
      </Flex>
    );
  }

  if ('todoList' in block.blockType) {
    return (
      <Flex>
        <Checkbox
          mt="4px"
          mr="md"
          checked={Boolean(block.properties.checked)}
          disabled
        />
        <Text>{Tree.toText(block.properties.title)}</Text>
      </Flex>
    );
  }

  // if ('numberedList' in block.blockType) {
  //   return (
  //     <NumberedListBlockRenderer
  //       blockExternalId={block.uuid}
  //       index={index}
  //       numeral={numeral || 0}
  //     />
  //   );
  // }

  if ('code' in block.blockType) {
    return (
      <Box p="lg" bg="dark" style={{ borderRadius: '0.25rem' }}>
        <pre>{Tree.toText(block.properties.title)}</pre>
      </Box>
    );
  }

  return <>Unknown Block Type</>;
};

interface BlockRendererProps {
  blockValue: {
    before: Block | null;
    after: Block;
  };
}

export const ActivityLogBlockRenderer = ({
  blockValue,
}: BlockRendererProps) => {
  const { before, after } = blockValue;
  // const parentBlock = parentBlockExternalId
  //   ? get<Block>(DATA_TYPES.block, parentBlockExternalId)
  //   : undefined;

  // const getPeviousSiblingBlockExternalId = useCallback(
  //   (currentBlockIndex: number) => {
  //     if (currentBlockIndex === 0) return undefined;
  //     if (!parentBlock) return undefined;

  //     const previousSiblingNode = getNodeAtPosition(
  //       parentBlock.content,
  //       currentBlockIndex - 1
  //     );

  //     return previousSiblingNode?.value;
  //   },
  //   [parentBlock]
  // );

  return (
    <Box className="FocusableBlock" mb="0.25rem">
      {/* <BlockWithActions
        key={before.uuid}
        blockExternalId={externalId}
        blockIndex={index}
        blockType={block.blockType}
        parentBlockExternalId={parentBlockExternalId}
        dragHandleProps={dragHandleProps}
      > */}
      <div>
        <BlockRendererInner block={after} />
        {/* {getSettingValue('developer.showBlockIds') && (
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
        )} */}
      </div>
      {/* </BlockWithActions> */}
    </Box>
  );
};
