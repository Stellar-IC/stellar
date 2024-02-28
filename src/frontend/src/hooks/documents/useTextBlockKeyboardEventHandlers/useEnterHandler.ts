import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { focusNextBlock as _focusNextBlock } from '@/modules/editor/utils';
import { Block, ExternalId } from '@/types';
import { Tree } from '@stellar-ic/lseq-ts';
import { parse } from 'uuid';
import { BlockType } from '../../../../../declarations/workspace/workspace.did';
import {
  insertBlockTitleCharacters,
  removeBlockTitleCharacters,
} from './utils';

type UseEnterHandlerProps = {
  blockExternalId?: ExternalId | null;
  blockIndex: number;
  blockType: BlockType;
  parentBlockExternalId?: ExternalId | null;
};

function focusNextBlock() {
  setTimeout(() => {
    _focusNextBlock();
  }, 100);
}

export function useEnterHandler({
  blockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
}: UseEnterHandlerProps) {
  const {
    addBlock,
    updateBlock,
    blocks: { updateLocal: updateLocalBlock },
    pages: { updateLocal: updateLocalPage },
  } = usePagesContext();
  const { get } = useDataStoreContext();

  const onEnterPressed = () => {
    if (!blockExternalId) return;
    if (!parentBlockExternalId) return;

    const block = get<Block>(DATA_TYPES.block, blockExternalId);
    if (!block) return;

    const cursorPosition = window.getSelection()?.anchorOffset;
    if (cursorPosition === undefined) return;

    const blockTitle = Tree.toText(block.properties.title);
    const blockTitleLength = blockTitle.length;
    const blockTitleAfterCursor = blockTitle.slice(cursorPosition);

    if (blockTitleLength === 0) {
      // Create a new block
      addBlock(parse(parentBlockExternalId), blockType, blockIndex + 1);
      focusNextBlock();
      return;
    }

    // Create a new block with the text after the cursor
    const newBlock = addBlock(
      parse(parentBlockExternalId),
      blockType,
      blockIndex + 1
    );

    // Focus on the new block
    focusNextBlock();

    insertBlockTitleCharacters(newBlock, blockTitleAfterCursor, {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
        if ('page' in updatedBlock.blockType) {
          updateLocalPage(updatedBlock.uuid, updatedBlock);
        }
      },
      onUpdateRemote: (updatedBlock, events) => {
        const updatedBlockExternalId = parse(updatedBlock.uuid);
        if (events.length === 0) return;
        updateBlock(updatedBlockExternalId, {
          updatePropertyTitle: {
            data: {
              blockExternalId: updatedBlockExternalId,
              transaction: events,
            },
          },
        });
      },
    });

    const charactersToRemove = [];
    for (let i = cursorPosition + 1; i <= blockTitleLength; i += 1) {
      charactersToRemove.push(i);
    }

    // Remove the text after the cursor from the current block
    removeBlockTitleCharacters(block, charactersToRemove.reverse(), {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
        if ('page' in updatedBlock.blockType) {
          updateLocalPage(updatedBlock.uuid, updatedBlock);
        }
      },
      onUpdateRemote: (updatedBlock, events) => {
        const blockExternalId = parse(updatedBlock.uuid);
        if (events.length === 0) return;
        updateBlock(blockExternalId, {
          updatePropertyTitle: {
            data: {
              blockExternalId,
              transaction: events,
            },
          },
        });
      },
    });
  };

  return onEnterPressed;
}
