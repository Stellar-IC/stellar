import { TextBlockBlockType } from '@/components/Editor/TextBlock/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockParentUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  ExternalId,
} from '../../../../../declarations/workspace/workspace.did';

export type PartialBlockEvent = {
  blockUpdated:
    | { updateContent: { data: BlockContentUpdatedEventData } }
    | { updatePropertyChecked: { data: BlockPropertyCheckedUpdatedEventData } }
    | { updateBlockType: { data: BlockBlockTypeUpdatedEventData } }
    | { updateParent: { data: BlockParentUpdatedEventData } }
    | { updatePropertyTitle: { data: BlockPropertyTitleUpdatedEventData } };
};

export type UseTextBlockKeyboardEventHandlersProps = {
  blockExternalId: ExternalId;
  blockIndex: number;
  blockType: TextBlockBlockType;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  showPlaceholder: () => void;
  hidePlaceholder: () => void;
  onError?: (error: Error) => void;
};
