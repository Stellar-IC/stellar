import { TextBlockBlockType } from '@/components/Editor/TextBlock/types';
import type { EditorSaveFn } from '@/modules/editor/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockParentUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  ExternalId,
  BlockCreatedEventData,
} from '../../../../../../declarations/workspace/workspace.did';

export type PartialBlockEvent =
  | {
      blockUpdated:
        | { updateContent: { data: BlockContentUpdatedEventData } }
        | {
            updatePropertyChecked: {
              data: BlockPropertyCheckedUpdatedEventData;
            };
          }
        | { updateBlockType: { data: BlockBlockTypeUpdatedEventData } }
        | { updateParent: { data: BlockParentUpdatedEventData } }
        | { updatePropertyTitle: { data: BlockPropertyTitleUpdatedEventData } };
    }
  | {
      blockCreated: { data: BlockCreatedEventData };
    };

export type useEditorEventHandlersProps = {
  blockExternalId: ExternalId;
  blockIndex: number;
  blockType: TextBlockBlockType;
  parentBlockExternalId?: ExternalId | null;
  showPlaceholder: () => void;
  hidePlaceholder: () => void;
  onSave: EditorSaveFn;
};
