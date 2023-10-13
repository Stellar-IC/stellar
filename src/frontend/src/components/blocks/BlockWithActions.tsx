import {
  Box,
  Button,
  Flex,
  useMantineTheme,
  // IconButton,
  // useDisclosure,
  // useBreakpointValue,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { PropsWithChildren, useCallback } from 'react';
import { IconPlus, IconDotsVertical } from '@tabler/icons-react';
import { parse } from 'uuid';

import { AddBlockModal } from '@/components/blocks/AddBlockModal';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Block } from '@/types';

import { TransformBlockModal } from './TransformBlockModal';
import { BlockType } from '../../../../declarations/workspace/workspace.did';

type BlockWithActionsProps = PropsWithChildren<{
  blockIndex: number;
  block: Block;
}>;

export const BlockWithActions = ({
  children,
  blockIndex,
  block,
}: BlockWithActionsProps) => {
  const { addBlock, removeBlock, updateBlock } = usePagesContext();
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
  const parentExternalId = block.parent;

  if (!parentExternalId) return <div />;

  const parsedParentExternalId = parse(parentExternalId);

  const onBlockTypeChange = useCallback(
    (item: BlockType) => {
      updateBlock(parsedParentExternalId, parse(block.uuid), {
        updateBlockType: {
          data: {
            blockExternalId: parse(block.uuid),
            blockType: item,
          },
        },
      });
    },
    [updateBlock, parsedParentExternalId, block.uuid]
  );

  return (
    <Box pos="relative" w="100%">
      <Flex
        tabIndex={0}
        onFocus={() => {
          // debugger;
          open();
        }}
        onBlur={() => {
          setTimeout(() => {
            close();
          }, 100);
        }}
        gap="50"
        justify="flex-start"
        w="100%"
      >
        <Button
          aria-label="Add block"
          leftSection={<IconPlus />}
          onClick={() => {
            if (shouldShowMobileModal) {
              onAddModalOpen();
            } else {
              addBlock(
                parse(parentExternalId),
                { paragraph: null },
                blockIndex + 1
              );
            }
          }}
        />
        <Button
          aria-label="View actions"
          leftSection={<IconDotsVertical />}
          onClick={() => {
            onTransformModalOpen();
          }}
        />
        <Box w="100%">{children}</Box>
      </Flex>

      <AddBlockModal
        isOpen={isAddModalOpen}
        onClose={() => {
          onAddModalClose();
        }}
        onItemSelected={(item) => {
          addBlock(parse(parentExternalId), item, blockIndex + 1);
        }}
      />

      <TransformBlockModal
        isOpen={isTransformModalOpen}
        onClose={onTransformModalClose}
        onItemSelected={onBlockTypeChange}
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
              removeBlock(parsedParentExternalId, parse(block.uuid));
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
            addBlock(parsedParentExternalId, item, blockIndex + 1);
          }}
          size="full"
        />
      )}
      {shouldShowMobileModal && (
        <TransformBlockModal
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
