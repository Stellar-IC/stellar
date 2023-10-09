import { Box, Stack } from '@mantine/core';
import { useEffect } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useBlockByUuid } from '@/hooks/documents/queries/useBlockByUuid';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Page } from '@/types';
import { BlockWithActions } from './BlockWithActions';
import { HeadingBlock } from './HeadingBlock';
import { TextBlock } from './TextBlock';

export const BlockRenderer = ({
  externalId,
  index,
}: {
  externalId: string;
  index: number;
}) => {
  const { identity } = useAuthContext();
  const { addBlock, blocks } = usePagesContext();
  const { query, insertCharacter, removeCharacter } = useBlockByUuid({
    identity,
  });
  const block = blocks.data[externalId];

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const parentExternalId = block?.parent;

  if (!block) return <div />;
  if (!parentExternalId) return <div />;

  if ('page' in block.blockType) {
    return (
      <>
        <Box ml="112px" mb="1rem" w="100%">
          <HeadingBlock key={String(block.uuid)} block={block} />
        </Box>
      </>
    );
  }

  if ('paragraph' in block.blockType) {
    return (
      <BlockWithActions key={block.uuid} blockIndex={index} block={block}>
        <TextBlock
          pageExternalId={parentExternalId}
          value={block.properties.title}
          blockExternalId={block.uuid}
          onEnterPressed={() => {
            addBlock(parse(parentExternalId), { paragraph: null }, index + 1);
            setTimeout(() => {
              console.log(document.querySelectorAll('.Blocks>.TextBlock'));
              const blocksDiv = document.querySelector('.Blocks');
              if (!blocksDiv) return;
              const blockToFocus =
                blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[
                  index + 1
                ];
              blockToFocus.querySelector('span')?.focus();
            }, 0);
          }}
          onInsert={(cursorPosition, character) =>
            insertCharacter(block.uuid, cursorPosition, character)
          }
          onRemove={(cursorPosition) =>
            removeCharacter(block.uuid, cursorPosition)
          }
        />
      </BlockWithActions>
    );
  }

  if (
    'heading1' in block.blockType ||
    'heading2' in block.blockType ||
    'heading3' in block.blockType
  ) {
    return (
      <BlockWithActions
        key={String(block.uuid)}
        blockIndex={index}
        block={block}
      >
        <HeadingBlock key={String(block.uuid)} block={block} />
      </BlockWithActions>
    );
  }

  return <>Unknown Block Type</>;
};

export const Blocks = ({ page }: { page: Page }) => (
  <Stack className="Blocks" w="100%" gap={0}>
    {page.content?.map((blockUuid, index) => (
      <BlockRenderer
        key={String(blockUuid)}
        index={index}
        externalId={blockUuid}
      />
    ))}
  </Stack>
);
