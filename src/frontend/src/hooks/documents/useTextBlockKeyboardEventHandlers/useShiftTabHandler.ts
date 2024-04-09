import { useCallback } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useSaveEvents } from '@/hooks/canisters/workspace/updates/useSaveEvents';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { store } from '@/modules/data-store';
import { focusBlock } from '@/modules/editor/utils';
import { ExternalId } from '@/types';

import { buildEvent, EditorController } from './utils';

type UseShiftTabHandler = {
  blockIndex: number;
  parentBlockIndex?: number;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
};

export const useShiftTabHandler = ({
  blockIndex,
  blockExternalId,
  parentBlockExternalId,
  parentBlockIndex,
}: UseShiftTabHandler) => {
  const { workspaceId } = useWorkspaceContext();
  const { identity, userId } = useAuthContext();

  const [saveEvents] = useSaveEvents({
    identity,
    workspaceId,
  });

  const doShiftTabOperation = useCallback(async () => {
    const parentBlock = parentBlockExternalId
      ? await db.blocks.get(parentBlockExternalId)
      : null;

    const grandparentBlock = parentBlock?.parent
      ? await db.blocks.get(parentBlock.parent)
      : null;

    if (!parentBlock) return false;
    if (parentBlockIndex === undefined) return false;
    if (!grandparentBlock) return false;

    const blockToMove = await db.blocks.get(blockExternalId);

    if (!blockToMove) return false;

    const controller = new EditorController({
      blockIndex,
      block: blockToMove,
      parentBlock,
      parentBlockIndex,
      grandparentBlock,
    });

    await controller.adoptSiblingBlocks();
    await controller.moveBlockToGrandparent();

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
  }, [
    blockExternalId,
    blockIndex,
    userId,
    parentBlockExternalId,
    parentBlockIndex,
    saveEvents,
  ]);

  return doShiftTabOperation;
};
