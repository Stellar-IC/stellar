import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockParentUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
} from '../../../../../declarations/workspace/workspace.did';

export type PartialBlockEvent = {
  blockUpdated:
    | { updateContent: { data: BlockContentUpdatedEventData } }
    | { updatePropertyChecked: { data: BlockPropertyCheckedUpdatedEventData } }
    | { updateBlockType: { data: BlockBlockTypeUpdatedEventData } }
    | { updateParent: { data: BlockParentUpdatedEventData } }
    | { updatePropertyTitle: { data: BlockPropertyTitleUpdatedEventData } };
};
