import { createContext } from 'react';

import { Block } from '@/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockParentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  BlockType,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

// eslint-disable-next-line no-spaced-func
export const PagesContext = createContext<{
  blocks: {
    updateLocal: (externalId: string, updatedData: Block) => void;
  };
  addBlock: (
    pageExternalId: UUID,
    blockType: BlockType,
    index: number
  ) => Promise<Block>;
  removeBlock: (pageExternalId: UUID, index: number) => Promise<void>;
  updateBlock: (
    blockExternalId: UUID,
    event:
      | { updateContent: { data: BlockContentUpdatedEventData } }
      | { updateBlockType: { data: BlockBlockTypeUpdatedEventData } }
      | { updateParent: { data: BlockParentUpdatedEventData } }
      | {
          updatePropertyChecked: {
            data: BlockPropertyCheckedUpdatedEventData;
          };
        }
      | { updatePropertyTitle: { data: BlockPropertyTitleUpdatedEventData } }
  ) => void;
} | null>(null);
