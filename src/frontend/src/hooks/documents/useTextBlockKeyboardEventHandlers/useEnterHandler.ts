import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
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

  const focusOnBlock = () => {
    const blocksDiv = document.querySelector('.Blocks');
    if (!blocksDiv) return;

    const blockToFocus =
      blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[blockIndex + 1];
    blockToFocus.querySelector('span')?.focus();
  };

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
      focusOnBlock();
      return;
    }

    // Create a new block with the text after the cursor
    const newBlock = addBlock(
      parse(parentBlockExternalId),
      blockType,
      blockIndex + 1
    );

    insertBlockTitleCharacters(newBlock, blockTitleAfterCursor, {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
        if ('page' in updatedBlock.blockType) {
          updateLocalPage(updatedBlock.uuid, updatedBlock);
        }
      },
      onUpdateRemote: (updatedBlock, events) => {
        const updatedBlockExternalId = parse(updatedBlock.uuid);
        updateBlock(updatedBlockExternalId, {
          updateProperty: {
            title: {
              data: {
                blockExternalId: updatedBlockExternalId,
                transaction: events,
              },
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
        updateBlock(blockExternalId, {
          updateProperty: {
            title: {
              data: {
                blockExternalId,
                transaction: events,
              },
            },
          },
        });
      },
    });

    // Focus on the new block
    setTimeout(() => {
      focusOnBlock();
    }, 100);
  };

  return onEnterPressed;
}
