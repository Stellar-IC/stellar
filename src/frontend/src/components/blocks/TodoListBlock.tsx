import { Checkbox, Flex } from '@mantine/core';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { Block } from '@/types';
import { TextBlock } from './TextBlock';

interface TodoListBlockProps {
  parentBlockIndex?: number;
  externalId: string;
  index: number;
}

export const TodoListBlock = ({
  externalId,
  index,
  parentBlockIndex,
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
            updatePropertyChecked: {
              data: {
                checked: e.target.checked,
                blockExternalId: parsedExternalId,
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
        parentBlockIndex={parentBlockIndex}
        value={block.properties.title}
        blockType={block.blockType}
      />
    </Flex>
  );
};
