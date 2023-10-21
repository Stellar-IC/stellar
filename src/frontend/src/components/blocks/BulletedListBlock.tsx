import { Flex } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { TextBlock } from './TextBlock';

export const BulletedListBlock = ({
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
