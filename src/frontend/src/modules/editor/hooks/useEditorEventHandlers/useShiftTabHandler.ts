import { useCallback } from 'react';

import { store } from '@/modules/data-store';
import { EditorController } from '@/modules/editor/EditorController';
import { EditorSaveFn } from '@/modules/editor/types';
import { focusBlock } from '@/modules/editor/utils/focus';
import { ExternalId } from '@/types';

type UseShiftTabHandler = {
  blockExternalId: ExternalId;
  onSave: EditorSaveFn;
};

export const useShiftTabHandler = ({
  blockExternalId,
  onSave,
}: UseShiftTabHandler) => {
  const doShiftTabOperation = useCallback(async () => {
    const blockToMove = store.blocks.get(blockExternalId);

    if (!blockToMove) return false;

    const controller = new EditorController({ onSave });

    await controller.adoptSiblingBlocks(blockToMove);
    await controller.moveBlockToGrandparent(blockToMove);
    await controller.save();

    focusBlock(blockToMove.uuid);

    return true;
  }, [blockExternalId, onSave]);

  return doShiftTabOperation;
};
