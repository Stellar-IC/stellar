import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useSaveEvents } from '@/hooks/canisters/workspace/updates/useSaveEvents';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { store } from '@/modules/data-store';
import { EditorController } from '@/modules/editor/EditorController';
import { focusBlock } from '@/modules/editor/utils/focus';
import { ExternalId } from '@/types';

import { buildEvent } from './utils';

type UseTabHandler = {
  blockIndex: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
};

export const useTabHandler = ({
  blockIndex,
  blockExternalId,
  parentBlockExternalId,
}: UseTabHandler) => {
  const { workspaceId } = useWorkspaceContext();
  const { identity, userId } = useAuthContext();
  const [saveEvents] = useSaveEvents({
    identity,
    workspaceId,
  });

  const doTabOperation = useCallback(async () => {
    if (blockIndex === 0) {
      return false;
    }

    const blockToMove = await db.blocks.get(blockExternalId);
    const parentBlock = parentBlockExternalId
      ? await db.blocks.get(parentBlockExternalId)
      : null;
    const previousBlockExternalId = parentBlock
      ? Tree.getNodeAtPosition(parentBlock.content, blockIndex - 1)?.value
      : null;
    const previousBlock = previousBlockExternalId
      ? await db.blocks.get(previousBlockExternalId)
      : null;

    if (!parentBlock) return false;
    if (!previousBlock) return false;
    if (!blockToMove) return false;

    const controller = new EditorController({
      blockIndex,
      block: blockToMove,
      parentBlock,
    });

    await controller.moveBlockToPreviousBlock();

    const { events, updatedBlocks } = controller;

    store.blocks.bulkPut(
      Object.values(updatedBlocks).map((block) => ({
        key: block.uuid,
        value: block,
      }))
    );
    await db.blocks.bulkPut(Object.values(updatedBlocks));
    await saveEvents({
      transaction: events.map((x) => buildEvent(x, userId)),
    });

    focusBlock(blockToMove.uuid);

    return true;
  }, [blockExternalId, blockIndex, parentBlockExternalId, saveEvents, userId]);

  return doTabOperation;
};
