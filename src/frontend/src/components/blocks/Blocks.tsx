import { Box, Stack } from '@mantine/core';
import { useEffect } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useBlockByUuid } from '@/hooks/documents/queries/useBlockByUuid';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Page } from '@/types';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
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
  const { workspaceId } = useWorkspaceContext();
  const { query, insertCharacter, removeCharacter } = useBlockByUuid({
    identity,
    workspaceId,
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

export const Blocks = ({ page }: { page: Page }) => {
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const { query, insertCharacter, removeCharacter } = useBlockByUuid({
    identity,
    workspaceId,
  });
  const { addBlock, blocks } = usePagesContext();

  const block = blocks.data[page.uuid];

  useEffect(() => {
    query(parse(page.uuid));
  }, [query, page.uuid]);

  console.log({ block });

  return (
    <Stack className="Blocks" w="100%" gap={0}>
      <div style={{ padding: '1rem 0' }}>
        <TextBlock
          value={page.properties.title}
          blockExternalId={page.uuid}
          // onEnterPressed={() => {
          //   addBlock(parse(parentExternalId), { paragraph: null }, index + 1);
          //   setTimeout(() => {
          //     const blocksDiv = document.querySelector('.Blocks');
          //     if (!blocksDiv) return;
          //     const blockToFocus =
          //       blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[index + 1];
          //     blockToFocus.querySelector('span')?.focus();
          //   }, 0);
          // }}
          onInsert={(cursorPosition, character) =>
            insertCharacter(page.uuid, cursorPosition, character)
          }
          onRemove={(cursorPosition) =>
            removeCharacter(page.uuid, cursorPosition)
          }
        />
      </div>

      {page.content?.map((blockUuid, index) => (
        <BlockRenderer
          key={String(blockUuid)}
          index={index}
          externalId={blockUuid}
        />
      ))}
    </Stack>
  );
};
