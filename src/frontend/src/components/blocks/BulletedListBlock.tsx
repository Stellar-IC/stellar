import { Flex } from '@mantine/core';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { useEffect } from 'react';
import { parse } from 'uuid';
import { TextBlock } from './TextBlock';

interface BulletedListBlockProps {
  externalId: string;
  index: number;
  onCharacterInserted: (cursorPosition: number, character: string) => void;
  onCharacterRemoved: (cursorPosition: number) => void;
  onEnterPressed?: () => void;
}

export const BulletedListBlock = ({
  externalId,
  index,
  onCharacterInserted,
  onCharacterRemoved,
  onEnterPressed,
}: BulletedListBlockProps) => {
  const {
    blocks: { data, query },
  } = usePagesContext();

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const block = data[externalId];

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
        onEnterPressed={onEnterPressed}
        onInsert={onCharacterInserted}
        onRemove={onCharacterRemoved}
      />
    </Flex>
  );
};
