import { Box, Divider, Stack, Text } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useSuccessHandlers } from '@/hooks/documents/hooks/useSuccessHandlers';
import { Tree } from '@myklenero/stellar-lseq-typescript';
import { Page } from '@/types';

import { BlockWithActions } from './BlockWithActions';
import { BulletedListBlock } from './BulletedListBlock';

import { TextBlock } from './TextBlock';
import { TodoListBlock } from './TodoListBlock';

interface BlockRendererProps {
  externalId: string;
  index: number;
  placeholder?: string;
  depth: number;
}

export const BlockRenderer = ({
  externalId,
  index,
  depth,
  placeholder,
}: BlockRendererProps) => {
  const {
    addBlock,
    blocks: { data, query, updateLocal: updateLocalBlock },
  } = usePagesContext();
  const block = useMemo(() => data[externalId], [data, externalId]);
  const parentExternalId = block?.parent;

  useEffect(() => {
    query(parse(externalId));
  }, [query, externalId]);

  const { onInsertSuccess, onRemoveSuccess } = useSuccessHandlers({
    block,
    updateLocalBlock,
  });

  if (!block) return <div />;
  if (!parentExternalId) return <div />;

  if ('page' in block.blockType) {
    return (
      <Box ml="112px" mb="1rem" w="100%">
        {/* <HeadingBlock key={String(block.uuid)} block={block} /> */}
      </Box>
    );
  }

  if (
    'heading1' in block.blockType ||
    'heading2' in block.blockType ||
    'heading3' in block.blockType ||
    'paragraph' in block.blockType
  ) {
    return (
      <>
        <BlockWithActions key={block.uuid} blockIndex={index} block={block}>
          <Box
            style={(theme) => ({
              paddingLeft: `calc(${depth} * ${theme.spacing.md})`,
            })}
          >
            <TextBlock
              pageExternalId={parentExternalId}
              value={block.properties.title}
              blockIndex={index}
              blockType={block.blockType}
              blockExternalId={block.uuid}
              placeholder={placeholder}
              onEnterPressed={() => {
                addBlock(
                  parse(parentExternalId),
                  { paragraph: null },
                  index + 1
                );
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
            <Text size="xs" c="gray.7">
              {block.uuid}
            </Text>
          </Box>
        </BlockWithActions>
        {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
        <BlockWithNestedBlocks blockExternalId={block.uuid} depth={depth + 1} />
      </>
    );
  }

  if ('bulletedList' in block.blockType) {
    return (
      <BlockWithActions key={block.uuid} blockIndex={index} block={block}>
        <BulletedListBlock externalId={block.uuid} index={index} />
      </BlockWithActions>
    );
  }

  if ('todoList' in block.blockType) {
    return (
      <BlockWithActions key={block.uuid} blockIndex={index} block={block}>
        <TodoListBlock externalId={block.uuid} index={index} />
      </BlockWithActions>
    );
  }

  return (
    <BlockWithActions key={block.uuid} blockIndex={index} block={block}>
      Unknown Block Type
    </BlockWithActions>
  );
};

interface BlockWithNestedBlocksProps {
  blockExternalId: string;
  depth: number;
}

export const BlockWithNestedBlocks = ({
  depth,
  blockExternalId,
}: BlockWithNestedBlocksProps) => {
  const {
    blocks: { data: blocks },
  } = usePagesContext();

  const block = useMemo(
    () => blocks[blockExternalId],
    [blocks, blockExternalId]
  );

  if (!block) return null;

  return (
    <Box pos="relative" w="100%">
      {Tree.toArray(block.content).map((externalId, i) => (
        <Box key={externalId}>
          <BlockRenderer
            key={externalId}
            externalId={externalId}
            index={i}
            depth={depth}
          />
        </Box>
      ))}
    </Box>
  );
};

export const Blocks = ({ page }: { page: Page }) => {
  const {
    blocks: { query, updateLocal },
  } = usePagesContext();
  const { onInsertSuccess, onRemoveSuccess } = useSuccessHandlers({
    block: page,
    updateLocalBlock: updateLocal,
  });

  useEffect(() => {
    query(parse(page.uuid));
  }, [query, page.uuid]);

  return (
    <Stack className="Blocks" w="100%" gap={0}>
      <div style={{ padding: '1rem 0' }}>
        <TextBlock
          blockExternalId={page.uuid}
          blockIndex={0}
          value={page.properties.title}
          blockType={{ heading1: null }}
          onInsert={(cursorPosition, character) =>
            Tree.insertCharacter(
              page.properties.title,
              cursorPosition,
              character,
              onInsertSuccess
            )
          }
          onRemove={(cursorPosition) =>
            Tree.removeCharacter(
              page.properties.title,
              cursorPosition,
              onRemoveSuccess
            )
          }
          placeholder="Untitled"
        />
      </div>

      <Divider mb="xl" />

      <div>
        {Tree.toArray(page.content).map((blockUuid, index) => (
          <BlockRenderer
            key={blockUuid}
            index={index}
            depth={0}
            externalId={blockUuid}
            placeholder={index === 0 ? 'Start typing here' : undefined}
          />
        ))}
      </div>
    </Stack>
  );
};
