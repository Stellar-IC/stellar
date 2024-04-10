import { useCallback } from 'react';

import { db } from '@/db';
import { EditorControllerV2 } from '@/modules/editor/EditorControllerV2';
import { focusBlock } from '@/modules/editor/utils/focus';
import { Block, ExternalId } from '@/types';

import { PartialBlockEvent } from './types';

type UseTabHandler = {
  blockExternalId: ExternalId;
  onSave: (data: {
    events: PartialBlockEvent[];
    updatedBlocks: { [key: string]: Block };
  }) => void;
};

export const useTabHandler = ({ blockExternalId, onSave }: UseTabHandler) => {
  const doTabOperation = useCallback(async () => {
    const blockToMove = await db.blocks.get(blockExternalId);
    if (!blockToMove) return false;

    const controller = new EditorControllerV2({ onSave });

    await controller.moveBlockToPreviousBlock(blockToMove);
    await controller.save();

    focusBlock(blockToMove.uuid);

    return true;
  }, [blockExternalId, onSave]);

  return doTabOperation;
};
