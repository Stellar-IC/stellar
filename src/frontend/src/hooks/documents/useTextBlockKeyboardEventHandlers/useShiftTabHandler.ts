import { useCallback } from 'react';

import { store } from '@/modules/data-store';
import { EditorControllerV2 } from '@/modules/editor/EditorControllerV2';
import { focusBlock } from '@/modules/editor/utils/focus';
import { Block, ExternalId } from '@/types';

import { PartialBlockEvent } from './types';

type UseShiftTabHandler = {
  blockExternalId: ExternalId;
  onSave: (data: {
    events: PartialBlockEvent[];
    updatedBlocks: { [key: string]: Block };
  }) => void;
};

export const useShiftTabHandler = ({
  blockExternalId,
  onSave,
}: UseShiftTabHandler) => {
  const doShiftTabOperation = useCallback(async () => {
    const blockToMove = store.blocks.get(blockExternalId);

    if (!blockToMove) return false;

    const controller = new EditorControllerV2({ onSave });

    await controller.adoptSiblingBlocks(blockToMove);
    await controller.moveBlockToGrandparent(blockToMove);
    await controller.save();

    focusBlock(blockToMove.uuid);

    return true;
  }, [blockExternalId, onSave]);

  return doShiftTabOperation;
};
