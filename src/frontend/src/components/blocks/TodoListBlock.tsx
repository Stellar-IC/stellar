import { Checkbox, Flex } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { TextBlock } from './TextBlock';

export const TodoListBlock = ({
  externalId,
  index,
}: {
  externalId: string;
  index: number;
}) => {
  const {
    addBlock,
    blocks: { data, query },
    insertCharacter,
    removeCharacter,
  } = usePagesContext();

  const block = useMemo(() => data[externalId], [data, externalId]);

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const parentExternalId = block?.parent;

  if (!block) return <div />;
  if (!parentExternalId) return <div />;
  if (!('todoList' in block.blockType)) {
    throw new Error('Expected todoList block');
  }

  return (
    <Flex>
      <Checkbox mt="4px" mx="md" />
      <TextBlock
        pageExternalId={parentExternalId}
        value={block.properties.title}
        blockExternalId={block.uuid}
        blockType={block.blockType}
        onEnterPressed={() => {
          addBlock(parse(parentExternalId), block.blockType, index + 1);
          setTimeout(() => {
            const blocksDiv = document.querySelector('.Blocks');
            if (!blocksDiv) return;
            const blockToFocus =
              blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[
                index + 2
              ];
            blockToFocus.querySelector('span')?.focus();
          }, 50);
        }}
        onInsert={(cursorPosition, character) =>
          insertCharacter(block.uuid, cursorPosition, character)
        }
        onRemove={(cursorPosition) =>
          removeCharacter(block.uuid, cursorPosition)
        }
      />
    </Flex>
  );
};
