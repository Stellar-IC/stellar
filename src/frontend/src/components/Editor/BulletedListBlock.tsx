import { Flex } from '@mantine/core';

import { Block } from '@/types';

import { TextBlock } from './TextBlock';

interface BulletedListBlockProps {
  block: Block;
  index: number;
}

export const BulletedListBlock = ({ block, index }: BulletedListBlockProps) => {
  if (!('bulletedList' in block.blockType)) {
    throw new Error('Expected bulletedList block');
  }

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
      <TextBlock
        blockExternalId={block.uuid}
        blockIndex={index}
        parentBlockExternalId={block.parent}
        value={block.properties.title}
        blockType={block.blockType}
      />
    </Flex>
  );
};
