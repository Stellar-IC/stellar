import { Tree } from '@stellar-ic/lseq-ts';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { db } from '@/db';
import * as BlockkModule from '@/modules/blocks';
import { focusBlock } from '@/modules/editor/utils/focus';
import { ExternalId } from '@/types';

import { BlockType } from '../../../../../declarations/workspace/workspace.did';

import { updateBlockLocal } from './utils';

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
  const { addBlock, updateBlock } = usePagesContext();

  const onEnterPressed = async () => {
    if (!blockExternalId) return;
    if (!parentBlockExternalId) return;

    const block = await db.blocks.get(blockExternalId);
    if (!block) return;

    const cursorPosition = window.getSelection()?.anchorOffset;
    if (cursorPosition === undefined) return;

    const blockTitle = Tree.toText(block.properties.title);
    const blockTitleLength = blockTitle.length;
    const blockTitleAfterCursor = blockTitle.slice(cursorPosition);

    if (blockTitleLength === 0) {
      // Create a new block
      const newBlock = await addBlock(
        parse(parentBlockExternalId),
        blockType,
        blockIndex + 1
      );

      focusBlock(newBlock.uuid);

      return;
    }

    // Create a new block with the text after the cursor
    const newBlock = await addBlock(
      parse(parentBlockExternalId),
      blockType,
      blockIndex + 1
    );

    // Focus on the new block
    focusBlock(newBlock.uuid);

    BlockkModule.insertTitleCharacters(newBlock, blockTitleAfterCursor, {
      onUpdateLocal: updateBlockLocal,
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

    const indexesToRemove = [];
    for (let i = cursorPosition + 1; i <= blockTitleLength; i += 1) {
      indexesToRemove.push(i);
    }

    // Remove the text after the cursor from the current block
    BlockkModule.removeTitleCharactersByIndex(
      block,
      indexesToRemove.reverse(),
      {
        onUpdateLocal: (updatedBlock) => {
          updateBlockLocal(updatedBlock);
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
      }
    );
  };

  return onEnterPressed;
}
