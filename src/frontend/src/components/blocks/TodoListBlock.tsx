import { Checkbox, Flex } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';

import { TextBlock } from './TextBlock';

interface TodoListBlockProps {
  externalId: string;
  index: number;
  onCharacterInserted: (cursorPosition: number, character: string) => void;
  onCharacterRemoved: (cursorPosition: number) => void;
}

export const TodoListBlock = ({
  externalId,
  index,
  onCharacterInserted,
  onCharacterRemoved,
}: TodoListBlockProps) => {
  const {
    updateBlock,
    blocks: { data, query },
  } = usePagesContext();
  const block = useMemo(() => data[externalId], [data, externalId]);

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const parentExternalId = block?.parent;

  if (!block) return <div />;
  if (!('todoList' in block.blockType)) {
    throw new Error('Expected todoList block');
  }

  const parsedExternalId = parse(externalId);

  return (
    <Flex>
      <Checkbox
        mt="4px"
        mr="md"
        onChange={(e) => {
          updateBlock(parsedExternalId, {
            updateProperty: {
              checked: {
                data: {
                  checked: e.target.checked,
                  blockExternalId: parsedExternalId,
                },
              },
            },
          });
        }}
        checked={Boolean(block.properties.checked)}
      />
      <TextBlock
        blockExternalId={block.uuid}
        blockIndex={index}
        parentBlockExternalId={parentExternalId}
        value={block.properties.title}
        blockType={block.blockType}
        onInsert={onCharacterInserted}
        onRemove={onCharacterRemoved}
      />
    </Flex>
  );
};
