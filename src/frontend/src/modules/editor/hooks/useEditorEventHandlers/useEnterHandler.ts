import { parse } from 'uuid';

import { db } from '@/db';
import * as BlockkModule from '@/modules/blocks';
import { EditorController } from '@/modules/editor/EditorController';
import { useEditorActions } from '@/modules/editor/hooks/useEditorActions';
import { EditorSaveFn } from '@/modules/editor/types';
import { focusBlock } from '@/modules/editor/utils/focus';
import { Tree } from '@/modules/lseq';
import { ExternalId } from '@/types';

import { BlockType } from '../../../../../../declarations/workspace/workspace.did';

import { updateBlockLocal } from './utils';

type UseEnterHandlerProps = {
  blockExternalId?: ExternalId | null;
  blockIndex: number;
  blockType: BlockType;
  parentBlockExternalId?: ExternalId | null;
  onSave: EditorSaveFn;
};

export function useEnterHandler({
  blockIndex,
  blockType,
  blockExternalId,
  parentBlockExternalId,
  onSave,
}: UseEnterHandlerProps) {
  const { updateBlock } = useEditorActions({ onSave });

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

    const controller = new EditorController({ onSave });

    if (blockTitleLength === 0) {
      await controller
        .addBlock(parse(parentBlockExternalId), blockIndex + 1, blockType)
        .save();
      const newBlock = controller.getNewestBlock();

      focusBlock(newBlock.uuid);

      return;
    }

    // Create a new block with the text after the cursor
    await controller
      .addBlock(parse(parentBlockExternalId), blockIndex + 1, blockType)
      .save();
    const newBlock = controller.getNewestBlock();

    // Focus on the new block
    focusBlock(newBlock.uuid);

    BlockkModule.insertTitleCharacters(newBlock, blockTitleAfterCursor, {
      onUpdateLocal: updateBlockLocal,
      onUpdateRemote: (updatedBlock, events) => {
        const updatedBlockExternalId = parse(updatedBlock.uuid);
        if (events.length === 0) return;
        updateBlock(updatedBlockExternalId, {
          updatePropertyTitle: {
            blockExternalId: updatedBlockExternalId,
            transaction: events,
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
              blockExternalId,
              transaction: events,
            },
          });
        },
      }
    );
  };

  return onEnterPressed;
}
