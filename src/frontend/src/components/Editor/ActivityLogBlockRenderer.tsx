import { Anchor, Box, Checkbox, Flex, Text } from '@mantine/core';
import { IconBulbFilled } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { Tree } from '@/modules/lseq';
import { Block } from '@/types';

interface BlockRendererInnerProps {
  block: Block;
}

const BlockRendererInner = ({ block }: BlockRendererInnerProps) => {
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
        <Text>{Tree.toText(block.properties.title)}</Text>
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

  return (
    <Box mb="0.25rem">
      <div>
        {before ? <BlockRendererInner block={before} /> : <></>}
        <BlockRendererInner block={after} />
      </div>
    </Box>
  );
};
