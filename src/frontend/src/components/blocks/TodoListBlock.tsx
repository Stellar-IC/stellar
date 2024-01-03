import { Checkbox, Flex } from '@mantine/core';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { Block } from '@/types';
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
  const { updateBlock } = usePagesContext();
  const { get } = useDataStoreContext();
  const block = get<Block>('block', externalId);

  if (!block) return null;
  if (!('todoList' in block.blockType)) {
    throw new Error('Expected todoList block');
  }

  const parentExternalId = block.parent;
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
