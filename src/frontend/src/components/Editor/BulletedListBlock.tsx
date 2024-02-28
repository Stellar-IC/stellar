import { Flex } from '@mantine/core';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { Block } from '@/types';

import { TextBlock } from './TextBlock';

interface BulletedListBlockProps {
  externalId: string;
  index: number;
}

export const BulletedListBlock = ({
  externalId,
  index,
}: BulletedListBlockProps) => {
  const { get } = useDataStoreContext();
  const block = get<Block>('block', externalId);

  if (!block) return null;

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
