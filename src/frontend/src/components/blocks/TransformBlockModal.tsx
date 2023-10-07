import {
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from '@mantine/core';
import { BlockType } from '../../../../declarations/documents/documents.did';

type TransformBlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onItemSelected: (item: BlockType) => void;
} & Pick<ModalProps, 'size'>;

export const TransformBlockModal = ({
  isOpen,
  onClose,
  onItemSelected,
  size,
}: TransformBlockModalProps) => {
  const menuItems = [
    {
      label: 'Text',
      value: { paragraph: null },
    },
    {
      label: 'Heading 1',
      value: { heading1: null },
    },
    {
      label: 'Heading 2',
      value: { heading2: null },
    },
    {
      label: 'Heading 3',
      value: { heading3: null },
    },
    // {
    //     label: "Image",
    //     value: "image",
    // },
  ] as const;

  return (
    <Modal opened={isOpen} onClose={onClose} size={size}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Turn into...</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {menuItems.map((menuItem) => (
            <Box
              key={menuItem.label}
              h="32px"
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
