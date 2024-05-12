import { useCallback } from 'react';

import { db } from '@/db';
import { EditorController } from '@/modules/editor/EditorController';
import { EditorSaveFn } from '@/modules/editor/types';
import { focusBlock } from '@/modules/editor/utils/focus';
import { ExternalId } from '@/types';

type UseTabHandler = {
  blockExternalId: ExternalId;
  onSave: EditorSaveFn;
};

export const useTabHandler = ({ blockExternalId, onSave }: UseTabHandler) => {
  const doTabOperation = useCallback(async () => {
    const blockToMove = await db.blocks.get(blockExternalId);

    if (!blockToMove) return false;

    const controller = new EditorController({ onSave });

    await controller.moveBlockToPreviousBlock(blockToMove);
    await controller.save();

    focusBlock(blockToMove.uuid);

    return true;
  }, [blockExternalId, onSave]);

  return doTabOperation;
};
