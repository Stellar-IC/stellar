import { Principal } from '@dfinity/principal';
import { parse, v4 } from 'uuid';

import { db } from '@/db';
import { getAuthClient } from '@/modules/auth/client';
import * as blockSerializers from '@/modules/blocks/serializers';
import { store } from '@/modules/data-store';
import { Tree } from '@/modules/lseq';
import { TreeEvent } from '@/modules/lseq/types';
import { Block } from '@/types';

import { createActor } from '../../../../../../declarations/workspace';
import {
  BlockEvent,
  SaveEventTransactionInput,
} from '../../../../../../declarations/workspace/workspace.did';

import { PartialBlockEvent } from './types';

type Context = {
  block: Block;
  workspaceId: Principal;
  userId: Principal;
};

type UpdateOptions = {
  onError?: (e: Error) => void;
};

async function _saveEvents(
  workspaceId: Principal,
  args: SaveEventTransactionInput
) {
  const authClient = await getAuthClient();
  const identity = authClient.getIdentity();
  const workspaceActor = createActor(workspaceId, {
    agentOptions: {
      identity,
    },
  });

  return workspaceActor.saveEvents(args);
}

function _updateBlock(
  context: Context,
  events: TreeEvent[],
  opts: UpdateOptions
) {
  const { block } = context;
  updateBlockLocal(block);
  updateBlockRemote(context, events, opts).catch((e) => {
    if (opts.onError) opts.onError(e);
    throw e;
  });
}

export function buildEvent(
  input: PartialBlockEvent,
  userId: Principal
): BlockEvent {
  const now = BigInt(Date.now()) * BigInt(1_000_000); // convert to nanoseconds
  const _build = <DataT>(data: DataT) => ({
    data,
    user: userId,
    uuid: parse(v4()),
    timestamp: now,
  });

  if ('blockCreated' in input) {
    return _build({
      blockCreated: {
        ...input.blockCreated.data,
      },
    });
  }

  if ('blockUpdated' in input) {
    if ('updatePropertyChecked' in input.blockUpdated) {
      return _build({
        blockUpdated: {
          updatePropertyChecked: {
            ...input.blockUpdated.updatePropertyChecked.data,
          },
        },
      });
    }

    if ('updatePropertyTitle' in input.blockUpdated) {
      return _build({
        blockUpdated: {
          updatePropertyTitle: {
            ...input.blockUpdated.updatePropertyTitle.data,
          },
        },
      });
    }

    if ('updateBlockType' in input.blockUpdated) {
      return _build({
        blockUpdated: {
          updateBlockType: {
            ...input.blockUpdated.updateBlockType.data,
          },
        },
      });
    }

    if ('updateParent' in input.blockUpdated) {
      return _build({
        blockUpdated: {
          updateParent: {
            ...input.blockUpdated.updateParent.data,
          },
        },
      });
    }

    if ('updateContent' in input.blockUpdated) {
      return _build({
        blockUpdated: {
          updateContent: {
            ...input.blockUpdated.updateContent.data,
          },
        },
      });
    }
  }

  throw new Error('Invalid event');
}

export function updateBlockLocal(updatedData: Block) {
  const serializedData = blockSerializers.toLocalStorage(updatedData);
  store.blocks.put(updatedData.uuid, updatedData);
  return db.blocks.put(serializedData, serializedData.uuid);
}

export function updateBlockRemote(
  context: Context,
  events: TreeEvent[],
  opts: UpdateOptions = {}
) {
  const { block, workspaceId, userId } = context;
  const { onError } = opts;

  return _saveEvents(workspaceId, {
    transaction: [
      buildEvent(
        {
          blockUpdated: {
            updatePropertyTitle: {
              data: {
                blockExternalId: parse(block.uuid),
                transaction: events,
              },
            },
          },
        },
        userId
      ),
    ],
  }).catch((e) => {
    if (onError) onError(e);

    throw e;
  });
}

export function insertCharacter(
  context: Context,
  position: number,
  character: string,
  opts: UpdateOptions = {}
) {
  const { block, workspaceId, userId } = context;
  const { onError } = opts;
  const events = Tree.insertValue(block.properties.title, position, character);
  _updateBlock({ block, workspaceId, userId }, events, {
    onError,
  });
}

export function insertCharacters(
  context: Context,
  characters: string[],
  position: number,
  opts: UpdateOptions = {}
) {
  const { block, workspaceId, userId } = context;
  const { onError } = opts;
  const allEvents: TreeEvent[] = [];

  characters.forEach((character, i) => {
    const events = Tree.insertValue(
      block.properties.title,
      position + i,
      character
    );
    allEvents.push(...events);
  });

  _updateBlock({ block, workspaceId, userId }, allEvents, {
    onError,
  });
}

export function onCharacterRemoved(
  context: Context,
  position: number,
  opts: UpdateOptions = {}
) {
  const { block, workspaceId, userId } = context;
  const { onError } = opts;
  const event = Tree.deleteValue(block.properties.title, position - 1);

  _updateBlock({ block, workspaceId, userId }, [event], {
    onError,
  });
}

export function removeCharacters(
  context: Context,
  startPosition: number,
  endPosition?: number,
  opts: UpdateOptions = {}
): void {
  const { block, workspaceId, userId } = context;
  const { onError } = opts;

  // Remove the character at the start position
  if (endPosition === undefined) {
    const event = Tree.deleteValue(block.properties.title, startPosition - 1);

    _updateBlock({ block, workspaceId, userId }, [event], {
      onError,
    });

    return;
  }

  // Remove the characters in the range
  // Here, we are building index array in descending order so that we don't
  // have to worry about the index changing as we remove characters
  const characterIndexes = Array.from(
    { length: endPosition - startPosition },
    (_, i) => endPosition - i
  );
  const allEvents: TreeEvent[] = [];

  characterIndexes.forEach((index) => {
    const event = Tree.deleteValue(block.properties.title, index - 1);
    if (event) allEvents.push(event);
  });

  _updateBlock({ block, workspaceId, userId }, allEvents, {
    onError,
  });
}

export function insertTextAtPosition(
  context: Context,
  clipboardText: string,
  position: number,
  target: HTMLSpanElement,
  opts: UpdateOptions = {}
) {
  const characters = target.innerText.split('');
  const clipboardCharacters = clipboardText.split('');

  characters.splice(position, 0, ...clipboardCharacters);
  target.innerText = characters.join(''); // eslint-disable-line no-param-reassign

  insertCharacters(context, clipboardCharacters, position, opts);
}
