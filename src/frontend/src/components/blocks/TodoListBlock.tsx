import { Checkbox, Flex } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useSuccessHandlers } from '@/hooks/documents/hooks/useSuccessHandlers';
import { Tree } from '@/modules/lseq';

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
    updateBlock,
    blocks: { data, query, updateLocal },
  } = usePagesContext();
  const block = useMemo(() => data[externalId], [data, externalId]);
  const { onInsertSuccess, onRemoveSuccess } = useSuccessHandlers({
    block,
    updateLocalBlock: updateLocal,
  });

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const parentExternalId = block?.parent;

  if (!block) return <div />;
  if (!parentExternalId) return <div />;
  if (!('todoList' in block.blockType)) {
    throw new Error('Expected todoList block');
  }

  const parsedExternalId = parse(externalId);

  return (
    <Flex>
      <Checkbox
        mt="4px"
        mx="md"
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
        blockIndex={index}
        pageExternalId={parentExternalId}
        value={block.properties.title}
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
          Tree.insertCharacter(
            block.properties.title,
            cursorPosition,
            character,
            onInsertSuccess
          )
        }
        onRemove={(cursorPosition) =>
          Tree.removeCharacter(
            block.properties.title,
            cursorPosition,
            onRemoveSuccess
          )
        }
      />
    </Flex>
  );
};
