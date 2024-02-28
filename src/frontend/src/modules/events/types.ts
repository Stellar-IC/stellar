import type { Principal } from '@dfinity/principal';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockEvent,
  BlockParentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  BlockType,
} from '../../../../declarations/workspace/workspace.did';

export type BlockContentUpdatedEvent = BlockEvent & {
  data: { blockUpdated: { updateContent: BlockContentUpdatedEventData } };
};

export type BlockBlockTypeUpdatedEvent = BlockEvent & {
  data: { blockUpdated: { updateBlockType: BlockBlockTypeUpdatedEventData } };
};

export type BlockParentUpdatedEvent = BlockEvent & {
  data: { blockUpdated: { updateParent: BlockParentUpdatedEventData } };
};

export type BlockPropertyCheckedUpdatedEvent = BlockEvent & {
  data: {
    blockUpdated: {
      updatePropertyChecked: BlockPropertyCheckedUpdatedEventData;
    };
  };
};

export type BlockPropertyTitleUpdatedEvent = BlockEvent & {
  data: {
    blockUpdated: { updatePropertyTitle: BlockPropertyTitleUpdatedEventData };
  };
};

export type SerializedUUID = string;

export type SerializedBlockCreatedEventData = {
  blockCreated: {
    block: {
      uuid: SerializedUUID;
      blockType: BlockType;
      parent?: SerializedUUID | null | undefined;
    };
    index: string;
  };
};

export type SerializedBlockContentUpdatedEventData = {
  updateContent: {
    blockExternalId: SerializedUUID;
    transaction: Array<TreeEvent>;
  };
};

export type SerializedBlockBlockTypeUpdatedEventData = {
  updateBlockType: {
    blockType: BlockType;
    blockExternalId: SerializedUUID;
  };
};

export type SerializedBlockParentUpdatedEventData = {
  updateParent: {
    parentBlockExternalId: SerializedUUID;
    blockExternalId: SerializedUUID;
  };
};

export type SerializedBlockPropertyCheckedUpdatedEventData = {
  updatePropertyChecked: {
    checked: boolean;
    blockExternalId: SerializedUUID;
  };
};

export type SerializedBlockPropertyTitleUpdatedEventData = {
  updatePropertyTitle: {
    blockExternalId: SerializedUUID;
    transaction: Array<TreeEvent>;
  };
};

export type SerializedBlockUpdatedEventData = {
  blockUpdated:
    | SerializedBlockContentUpdatedEventData
    | SerializedBlockBlockTypeUpdatedEventData
    | SerializedBlockParentUpdatedEventData
    | SerializedBlockPropertyCheckedUpdatedEventData
    | SerializedBlockPropertyTitleUpdatedEventData;
};

export type SerializedBlockEvent = {
  uuid: SerializedUUID;
  user: Principal;
  data: SerializedBlockCreatedEventData | SerializedBlockUpdatedEventData;
  timestamp: string;
};

export type SerializedBlockContentUpdatedEvent = SerializedBlockEvent & {
  data: {
    blockUpdated: SerializedBlockContentUpdatedEventData;
  };
};

export type SerializedBlockBlockTypeUpdatedEvent = SerializedBlockEvent & {
  data: {
    blockUpdated: SerializedBlockBlockTypeUpdatedEventData;
  };
};

export type SerializedBlockParentUpdatedEvent = SerializedBlockEvent & {
  data: {
    blockUpdated: SerializedBlockParentUpdatedEventData;
  };
};

export type SerializedBlockPropertyCheckedUpdatedEvent =
  SerializedBlockEvent & {
    data: {
      blockUpdated: SerializedBlockPropertyCheckedUpdatedEventData;
    };
  };

export type SerializedBlockPropertyTitleUpdatedEvent = SerializedBlockEvent & {
  data: {
    blockUpdated: SerializedBlockPropertyTitleUpdatedEventData;
  };
};
