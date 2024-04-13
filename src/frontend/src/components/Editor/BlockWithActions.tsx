import { Box, Button, Flex, Group, rem, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconGridDots } from '@tabler/icons-react';
import { PropsWithChildren, useCallback } from 'react';
import { parse } from 'uuid';

import { AddBlockModal } from '@/components/Editor/AddBlockModal';
import { useEditorSave } from '@/hooks/useEditorSave';
import { useEditorActions } from '@/modules/editor/hooks/useEditorActions';

import { BlockType } from '../../../../declarations/workspace/workspace.did';

import classes from './BlockWithActions.module.css';
import { TransformBlockModal } from './TransformBlockModal';

type BlockWithActionsProps = PropsWithChildren<{
  blockIndex: number;
  blockExternalId: string;
  blockType: BlockType;
  parentBlockExternalId?: string;
}>;

export const BlockWithActions = ({
  children,
  blockIndex,
  blockExternalId,
  blockType,
  parentBlockExternalId,
}: BlockWithActionsProps) => {
  const [isOpen, { open, close }] = useDisclosure();
  const theme = useMantineTheme();
  // const shouldShowMobileModal = useMediaQuery(
  //   `(max-width: ${theme.breakpoints.sm})`
  // );
  const shouldShowMobileModal = false;

  const [isAddModalOpen, { open: onAddModalOpen, close: onAddModalClose }] =
    useDisclosure();

  const [
    isTransformModalOpen,
    { open: onTransformModalOpen, close: onTransformModalClose },
  ] = useDisclosure();

  const [isShowingActions, { open: showActions, close: hideActions }] =
    useDisclosure();

  const onSave = useEditorSave();

  const { addBlock, updateBlock, removeBlock } = useEditorActions({
    onSave,
  });

  const parsedParentExternalId = parentBlockExternalId
    ? parse(parentBlockExternalId)
    : null;

  const onBlockTypeChange = useCallback(
    (item: BlockType) => {
      updateBlock(parse(blockExternalId), {
        updateBlockType: {
          blockExternalId: parse(blockExternalId),
          blockType: item,
        },
      });
    },
    [blockExternalId, updateBlock]
  );

  return (
    <Box pos="relative" w="100%">
      <Flex
        tabIndex={0}
        onFocus={() => {
          open();
        }}
        onBlur={() => {
          setTimeout(() => {
            close();
          }, 100);
        }}
        gap={theme.spacing.md}
        justify="flex-start"
        w="100%"
        onMouseEnter={() => {
          showActions();
        }}
        onMouseLeave={() => {
          hideActions();
        }}
      >
        <Group
          mt={rem(3)}
          className={classes.actionButtons}
          gap="2px"
          style={{ opacity: isShowingActions ? 1 : 0 }}
        >
          <Button
            size="compact-sm"
            aria-label="Add block"
            onClick={() => {
              if (!parsedParentExternalId) return;

              if (shouldShowMobileModal) {
                onAddModalOpen();
              } else {
                addBlock(
                  parsedParentExternalId,
                  { paragraph: null },
                  blockIndex + 1
                );
              }
            }}
          >
            <IconPlus size="12px" />
          </Button>
          <Button
            size="compact-sm"
            aria-label="View actions"
            onClick={() => {
              onTransformModalOpen();
            }}
          >
            <IconGridDots size="12px" />
          </Button>
        </Group>

        <Group
          className={classes.actionBar}
          gap="2px"
          style={{ opacity: isShowingActions ? 1 : 0 }}
        >
          <Button
            aria-label="Add block"
            onClick={() => {
              if (!parsedParentExternalId) return;

              if (shouldShowMobileModal) {
                onAddModalOpen();
              } else {
                addBlock(
                  parsedParentExternalId,
                  { paragraph: null },
                  blockIndex + 1
                );
              }
            }}
            size="xs"
            px="xs"
          >
            <IconPlus size="12px" />
            Add Block
          </Button>
          <Button
            aria-label="View actions"
            onClick={() => {
              onTransformModalOpen();
            }}
            size="xs"
            px="xs"
          >
            Transform
          </Button>
        </Group>

        <Box w="100%">{children}</Box>
      </Flex>

      <AddBlockModal
        isOpen={isAddModalOpen}
        onClose={() => {
          onAddModalClose();
        }}
        onItemSelected={(item) => {
          if (!parsedParentExternalId) return;
          addBlock(parsedParentExternalId, item, blockIndex + 1);
        }}
      />

      <TransformBlockModal
        isOpen={isTransformModalOpen}
        onClose={onTransformModalClose}
        onItemSelected={onBlockTypeChange}
        currentBlockType={blockType}
      />

      {shouldShowMobileModal && (
        <Flex
          pos="absolute"
          // zIndex={1000}
          // backgroundColor={"#333"}
          left={0}
          right={0}
          bottom="-48px"
          // borderRadius="md"
          display={isOpen ? 'flex' : 'none'}
          color="white"
        >
          <Button
            color="inherit"
            onClick={() => {
              if (!parsedParentExternalId) return;
              addBlock(
                parsedParentExternalId,
                { paragraph: null },
                blockIndex + 1
              );
            }}
          >
            +
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              onTransformModalOpen();
            }}
          >
            Turn into
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              if (!parsedParentExternalId) return;
              // Note: We add 1 to the block index because the current functionality
              // for removing a block is to remove the block before the given position.
              removeBlock(parsedParentExternalId, blockIndex + 1);
            }}
          >
            Delete
          </Button>
        </Flex>
      )}

      {shouldShowMobileModal && (
        <AddBlockModal
          isOpen={isAddModalOpen}
          onClose={() => {
            onAddModalClose();
          }}
          onItemSelected={(item) => {
            if (!parsedParentExternalId) return;
            addBlock(parsedParentExternalId, item, blockIndex + 1);
          }}
          size="full"
        />
      )}
      {shouldShowMobileModal && (
        <TransformBlockModal
          currentBlockType={blockType}
          isOpen={isTransformModalOpen}
          onClose={() => {
            onTransformModalClose();
          }}
          onItemSelected={onBlockTypeChange}
          size="full"
        />
      )}
    </Box>
  );
};
