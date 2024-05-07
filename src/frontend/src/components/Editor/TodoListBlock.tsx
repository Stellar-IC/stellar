import { Checkbox, Flex } from '@mantine/core';
import { parse } from 'uuid';

import { useEditorSave } from '@/hooks/editor/useEditorSave';
import { useEditorActions } from '@/modules/editor/hooks/useEditorActions';
import { Block } from '@/types';

import { TextBlock } from './TextBlock';

interface TodoListBlockProps {
  block: Block;
  index: number;
}

export const TodoListBlock = ({ block, index }: TodoListBlockProps) => {
  if (!('todoList' in block.blockType)) {
    throw new Error('Expected todoList block');
  }

  const onSave = useEditorSave();
  const { updateBlock } = useEditorActions({
    onSave,
  });
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
              checked: e.target.checked,
              blockExternalId: parsedExternalId,
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
      />
    </Flex>
  );
};
