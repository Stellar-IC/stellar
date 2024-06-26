import { Box, CheckIcon, Group, Modal, ModalProps } from '@mantine/core';

import { BlockType } from '../../../../declarations/workspace/workspace.did';

type TransformBlockModalProps = {
  currentBlockType: BlockType;
  isOpen: boolean;
  onClose: () => void;
  onItemSelected: (item: BlockType) => void;
} & Pick<ModalProps, 'size'>;

export const TransformBlockModal = ({
  currentBlockType,
  isOpen,
  onClose,
  onItemSelected,
  size,
}: TransformBlockModalProps) => {
  const menuItems = [
    {
      label: 'Page',
      value: { page: null },
    },
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
    {
      label: 'To-do List',
      value: { todoList: null },
    },
    {
      label: 'Bulleted List',
      value: { bulletedList: null },
    },
    {
      label: 'Numbered List',
      value: { numberedList: null },
    },
    {
      label: 'Code',
      value: { code: null },
    },
    {
      label: 'Quote',
      value: { quote: null },
    },
    {
      label: 'Callout',
      value: { callout: null },
    },
  ] as const;

  return (
    <Modal.Root opened={isOpen} onClose={onClose} size={size}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Turn into...</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          {menuItems.map((menuItem) => (
            <Group key={menuItem.label}>
              <Box
                key={menuItem.label}
                h="2rem"
                lh="2rem"
                onClick={() => {
                  onItemSelected(menuItem.value);
                  onClose();
                }}
              >
                {menuItem.label}
              </Box>
              {Object.keys(currentBlockType)[0] ===
                Object.keys(menuItem.value)[0] && <CheckIcon size={16} />}
            </Group>
          ))}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};
