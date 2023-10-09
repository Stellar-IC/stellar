import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  // ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from '@mantine/core';
import { BlockType } from '../../../../declarations/workspace/workspace.did';

type AddBlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onItemSelected: (item: BlockType) => void;
} & Pick<ModalProps, 'size'>;

export const AddBlockModal = ({
  size,
  isOpen,
  onClose,
  onItemSelected,
}: AddBlockModalProps) => {
  const menuItems = [
    {
      label: 'Text',
      value: { paragraph: null },
    },
  ] as const;

  return (
    <Modal opened={isOpen} onClose={onClose} size={size}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add block</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {menuItems.map((menuItem) => (
            <Box
              key={menuItem.label}
              // fontSize="100"
              // fontWeight="semibold"
              onClick={() => {
                onItemSelected(menuItem.value);
                onClose();
              }}
            >
              {menuItem.label}
            </Box>
          ))}
          {/* <Menu isOpen size="full" matchWidth>
                        <MenuList width="100%"> */}
          {/* </MenuList>
                    </Menu> */}
        </ModalBody>

        {/* <ModalFooter>
                    <Button
                        // colorScheme="blue"
                        mr={3}
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button variant="ghost">Secondary Action</Button>
                </ModalFooter> */}
      </ModalContent>
    </Modal>
  );
};
