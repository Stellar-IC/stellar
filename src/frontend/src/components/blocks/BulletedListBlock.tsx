import { Flex } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useSuccessHandlers } from '@/hooks/documents/hooks/useSuccessHandlers';
import { Tree } from '@myklenero/stellar-lseq-typescript';

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
