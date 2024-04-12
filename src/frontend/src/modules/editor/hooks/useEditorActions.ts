import { useCallback } from 'react';

import {
  UUID,
  BlockType,
  BlockContentUpdatedEventData,
  BlockBlockTypeUpdatedEventData,
  BlockParentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
} from '../../../../../declarations/workspace/workspace.did';
import { EditorController } from '../EditorController';
import { EditorSaveFn } from '../types';

interface UseEditorActionsProps {
  onSave: EditorSaveFn;
}

export function useEditorActions({ onSave }: UseEditorActionsProps) {
  const addBlock = useCallback(
    (parentExternalId: UUID, blockType: BlockType, index: number) => {
      const editorController = new EditorController({ onSave });
      editorController.addBlock(parentExternalId, index, blockType);
      return editorController.save();
    },
    [onSave]
  );

  const updateBlock = useCallback(
    (
      blockExternalId: UUID,
      event:
        | { updateContent: BlockContentUpdatedEventData }
        | { updateBlockType: BlockBlockTypeUpdatedEventData }
        | { updateParent: BlockParentUpdatedEventData }
        | { updatePropertyChecked: BlockPropertyCheckedUpdatedEventData }
        | { updatePropertyTitle: BlockPropertyTitleUpdatedEventData }
    ) => {
      const editorController = new EditorController({ onSave });
      editorController.updateBlock(blockExternalId, event);
      return editorController.save();
    },
    [onSave]
  );

  const removeBlock = useCallback(
    (parentExternalId: UUID, index: number) => {
      const editorController = new EditorController({ onSave });
      editorController.removeBlock(parentExternalId, index);
      return editorController.save();
    },
    [onSave]
  );

  return {
    addBlock,
    updateBlock,
    removeBlock,
  };
}
