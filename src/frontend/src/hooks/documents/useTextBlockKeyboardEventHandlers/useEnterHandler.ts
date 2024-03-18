import { Tree } from '@stellar-ic/lseq-ts';
import { parse } from 'uuid';

import { usePages } from '@/contexts/PagesContext/usePages';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { focusBlock } from '@/modules/editor/utils';
import { ExternalId } from '@/types';

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
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const {
    blocks: { updateLocal: updateLocalBlock },
  } = usePages({
    identity,
    workspaceId,
  });
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

    insertBlockTitleCharacters(newBlock, blockTitleAfterCursor, {
      onUpdateLocal: (updatedBlock) => {
        updateLocalBlock(updatedBlock.uuid, updatedBlock);
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
