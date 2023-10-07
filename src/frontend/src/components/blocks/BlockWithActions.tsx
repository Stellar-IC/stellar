import {
  Box,
  Button,
  Flex,
  // IconButton,
  // useDisclosure,
  // useBreakpointValue,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PropsWithChildren } from 'react';
import { IconPlus, IconDotsVertical } from '@tabler/icons-react';
import { parse } from 'uuid';

import { AddBlockModal } from '@/components/blocks/AddBlockModal';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Block } from '@/types';

import { TransformBlockModal } from './TransformBlockModal';

type BlockWithActionsProps = PropsWithChildren<{
  blockIndex: number;
  block: Block;
}>;

export const BlockWithActions = ({ children, blockIndex, block }: BlockWithActionsProps) => {
  const { addBlock, removeBlock } = usePagesContext();
  const [isOpen, { open, close }] = useDisclosure();
  const shouldShowMobileModal = false;
  // const shouldShowMobileModal = useBreakpointValue({
  //     base: true,
  //     md: false,
  // });
  const [isAddModalOpen, { open: onAddModalOpen, close: onAddModalClose }] = useDisclosure();
  const [isTransformModalOpen, { open: onTransformModalOpen, close: onTransformModalClose }] =
    useDisclosure();

  const parentExternalId = block.parent;

  if (!parentExternalId) return <div />;

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
            addBlock(parse(parentExternalId), { paragraph: null }, blockIndex + 1);
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
          // handleBlockEvent({
          //     type: "addBlock",
          //     data: {
          //         blockType: { paragraph: null },
          //         index: blockIndex + 1,
          //     },
          // });
        }}
      />

      <TransformBlockModal
        isOpen={isTransformModalOpen}
        onClose={onTransformModalClose}
        onItemSelected={(item) => {
          // updateBlock({
          //     ...block,
          //     blockType: item,
          // });
        }}
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
              addBlock(parse(parentExternalId), { paragraph: null }, blockIndex + 1);
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
              removeBlock(parse(parentExternalId), parse(block.uuid));
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
            // addBlock(item, blockIndex + 1);
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
          onItemSelected={(item) => {
            // updateBlock(block.id, {
            //     ...block,
            //     type: item,
            // });
          }}
          size="full"
        />
      )}
    </Box>
  );
};
