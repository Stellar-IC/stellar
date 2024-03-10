import { Checkbox, Flex } from '@mantine/core';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { Block } from '@/types';

import { TextBlock } from './TextBlock';

interface TodoListBlockProps {
  parentBlockIndex?: number;
  block: Block;
  index: number;
}

export const TodoListBlock = ({
  block,
  index,
  parentBlockIndex,
}: TodoListBlockProps) => {
  if (!('todoList' in block.blockType)) {
    throw new Error('Expected todoList block');
  }

  const { updateBlock } = usePagesContext();
  const parentExternalId = block.parent;
  const parsedExternalId = parse(block.uuid);

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
