import { DEFAULT_BOUNDARY } from '@stellar-ic/lseq-ts/constants';
import { base } from '@stellar-ic/lseq-ts/Node';
import { stringify } from 'uuid';
import { BlockEvent } from '../../../../declarations/workspace/workspace.did';
import { serializeBlock } from '../blocks/serializers';
import {
  BlockBlockTypeUpdatedEvent,
  BlockContentUpdatedEvent,
  BlockParentUpdatedEvent,
  BlockPropertyCheckedUpdatedEvent,
  BlockPropertyTitleUpdatedEvent,
  SerializedBlockBlockTypeUpdatedEvent,
  SerializedBlockContentUpdatedEvent,
  SerializedBlockEvent,
  SerializedBlockParentUpdatedEvent,
  SerializedBlockPropertyCheckedUpdatedEvent,
  SerializedBlockPropertyTitleUpdatedEvent,
} from './types';

export function serializeBlockEvent(event: BlockEvent): SerializedBlockEvent {
  if ('blockCreated' in event.data) {
    return {
      ...event,
      uuid: stringify(event.uuid),
      timestamp: String(event.timestamp),
      data: {
        blockCreated: {
          ...event.data.blockCreated,
          block: serializeBlock({
            ...event.data.blockCreated.block,
            content: {
              allocationStrategies: [],
              boundary: DEFAULT_BOUNDARY,
              rootNode: {
                base: base(0),
                children: [],
                deletedAt: [],
                identifier: [],
                value: '',
              },
            },
            properties: {
              title: [],
              checked: [],
            },
          }),
          index: String(event.data.blockCreated.index),
        },
      },
    };
  }

  if ('blockUpdated' in event.data) {
    return serializeBlockUpdatedEvent(event);
  }

  throw new Error('Unsupported event type');
}

function serializeBlockUpdatedEvent(event: BlockEvent): SerializedBlockEvent {
  if (!('blockUpdated' in event.data)) {
    throw new Error('Expected blockUpdated in event data');
  }

  if ('updateContent' in event.data.blockUpdated) {
    return serializeBlockContentUpdatedEvent(event as BlockContentUpdatedEvent);
  }

  if ('updateBlockType' in event.data.blockUpdated) {
    return serializeBlockTypeUpdatedEvent(event as BlockBlockTypeUpdatedEvent);
  }

  if ('updateParent' in event.data.blockUpdated) {
    return serializeBlockParentUpdatedEvent(event as BlockParentUpdatedEvent);
  }

  if ('updatePropertyChecked' in event.data.blockUpdated) {
    return serializeBlockPropertyCheckedUpdatedEvent(
      event as BlockPropertyCheckedUpdatedEvent
    );
  }

  if ('updatePropertyTitle' in event.data.blockUpdated) {
    return serializeBlockPropertyTitleUpdatedEvent(
      event as BlockPropertyTitleUpdatedEvent
    );
  }

  throw new Error('Unsupported event type');
}

function serializeBlockContentUpdatedEvent(
  event: BlockContentUpdatedEvent
): SerializedBlockContentUpdatedEvent {
  return {
    ...event,
    uuid: stringify(event.uuid),
    data: {
      ...event.data,
      blockUpdated: {
        ...event.data.blockUpdated,
        updateContent: {
          ...event.data.blockUpdated.updateContent,
          blockExternalId: stringify(
            event.data.blockUpdated.updateContent.blockExternalId
          ),
          transaction: event.data.blockUpdated.updateContent.transaction,
        },
      },
    },
    timestamp: String(event.timestamp),
  };
}

function serializeBlockTypeUpdatedEvent(
  event: BlockBlockTypeUpdatedEvent
): SerializedBlockBlockTypeUpdatedEvent {
  return {
    ...event,
    uuid: stringify(event.uuid),
    data: {
      ...event.data,
      blockUpdated: {
        ...event.data.blockUpdated,
        updateBlockType: {
          ...event.data.blockUpdated.updateBlockType,
          blockType: event.data.blockUpdated.updateBlockType.blockType,
          blockExternalId: stringify(
            event.data.blockUpdated.updateBlockType.blockExternalId
          ),
        },
      },
    },
    timestamp: String(event.timestamp),
  };
}

function serializeBlockParentUpdatedEvent(
  event: BlockParentUpdatedEvent
): SerializedBlockParentUpdatedEvent {
  return {
    ...event,
    uuid: stringify(event.uuid),
    data: {
      ...event.data,
      blockUpdated: {
        ...event.data.blockUpdated,
        updateParent: {
          ...event.data.blockUpdated.updateParent,
          parentBlockExternalId: stringify(
            event.data.blockUpdated.updateParent.parentBlockExternalId
          ),
          blockExternalId: stringify(
            event.data.blockUpdated.updateParent.blockExternalId
          ),
        },
      },
    },
    timestamp: String(event.timestamp),
  };
}

function serializeBlockPropertyCheckedUpdatedEvent(
  event: BlockPropertyCheckedUpdatedEvent
): SerializedBlockPropertyCheckedUpdatedEvent {
  return {
    ...event,
    uuid: stringify(event.uuid),
    data: {
      ...event.data,
      blockUpdated: {
        ...event.data.blockUpdated,
        updatePropertyChecked: {
          ...event.data.blockUpdated.updatePropertyChecked,
          checked: event.data.blockUpdated.updatePropertyChecked.checked,
          blockExternalId: stringify(
            event.data.blockUpdated.updatePropertyChecked.blockExternalId
          ),
        },
      },
    },
    timestamp: String(event.timestamp),
  };
}

function serializeBlockPropertyTitleUpdatedEvent(
  event: BlockPropertyTitleUpdatedEvent
): SerializedBlockPropertyTitleUpdatedEvent {
  return {
    ...event,
    uuid: stringify(event.uuid),
    data: {
      ...event.data,
      blockUpdated: {
        ...event.data.blockUpdated,
        updatePropertyTitle: {
          ...event.data.blockUpdated.updatePropertyTitle,
          blockExternalId: stringify(
            event.data.blockUpdated.updatePropertyTitle.blockExternalId
          ),
          transaction: event.data.blockUpdated.updatePropertyTitle.transaction,
        },
      },
    },
    timestamp: String(event.timestamp),
  };
}
