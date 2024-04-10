import { Identity } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback } from 'react';
import { stringify } from 'uuid';

import { db } from '@/db';
import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import {
  onCharacterInserted,
  updateBlockLocal,
} from '@/hooks/documents/useTextBlockKeyboardEventHandlers/utils';
import { useUpdate } from '@/hooks/useUpdate';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Block } from '@/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockCreatedEventData,
  BlockEvent,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

import { usePageEvents } from './usePageEvents';

type CoreBlockEvent = {
  user: Principal;
  uuid: UUID;
  timestamp: bigint;
};

type BlockContentUpdatedEvent = CoreBlockEvent & {
  data: { blockUpdated: { updateContent: BlockContentUpdatedEventData } };
};

type BlockPropertyCheckedUpdatedEvent = CoreBlockEvent & {
  data: {
    blockUpdated: {
      updatePropertyChecked: BlockPropertyCheckedUpdatedEventData;
    };
  };
};

type BlockPropertyTitleUpdatedEvent = CoreBlockEvent & {
  data: {
    blockUpdated: { updatePropertyTitle: BlockPropertyTitleUpdatedEventData };
  };
};

type BlockTypeUpdatedEvent = CoreBlockEvent & {
  data: { blockUpdated: { updateBlockType: BlockBlockTypeUpdatedEventData } };
};

type BlockCreatedEvent = CoreBlockEvent & {
  data: { blockCreated: BlockCreatedEventData };
};

export const usePages = (props: {
  workspaceId: Principal;
  identity: Identity;
}) => {
  const { identity, workspaceId } = props;
  const { userId } = useAuthContext();
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const { storeEventLocal } = usePageEvents({
    storageAdapter: {
      put: async (item, key) => {
        await db.blockEvents.put(item, key);
      },
    },
  });

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const updateContent = useCallback((_event: BlockContentUpdatedEvent) => {
    // TODO: Figure out what needs to happen here
  }, []);

  const createBlock = useCallback(
    async (event: BlockCreatedEvent): Promise<Block | undefined> => {
      if (!event.data.blockCreated.block.parent[0]) {
        return undefined;
      }

      const eventData = event.data.blockCreated;
      const blockExternalId = stringify(event.data.blockCreated.block.uuid);
      const parentExternalId = eventData.block.parent[0]
        ? stringify(eventData.block.parent[0])
        : null;

      if (!parentExternalId) {
        return undefined;
      }

      const parentBlock = await db.blocks.get(parentExternalId);

      if (!parentBlock) {
        return undefined;
      }

      const block = {
        content: new Tree.Tree(),
        parent: parentExternalId,
        properties: {
          title: new Tree.Tree(),
          checked: false,
        },
        blockType: event.data.blockCreated.block.blockType,
        uuid: blockExternalId,
      };

      // Save the block locally
      updateBlockLocal(block);

      // Add block to parent block's content
      onCharacterInserted(
        {
          block: parentBlock,
          workspaceId,
          userId,
        },
        Number(event.data.blockCreated.index),
        blockExternalId
      );

      return block;
    },
    [userId, workspaceId]
  );

  const updateBlockType = useCallback(async (event: BlockTypeUpdatedEvent) => {
    const blockExternalId = stringify(
      event.data.blockUpdated.updateBlockType.blockExternalId
    );
    const currentBlock = await db.blocks
      .where('uuid')
      .equals(blockExternalId)
      .first();

    if (!currentBlock) {
      return;
    }

    updateBlockLocal({
      ...currentBlock,
      blockType: event.data.blockUpdated.updateBlockType.blockType,
    });
  }, []);

  const updatePropertyChecked = useCallback(
    async (event: BlockPropertyCheckedUpdatedEvent) => {
      const blockExternalId = stringify(
        event.data.blockUpdated.updatePropertyChecked.blockExternalId
      );
      const currentBlock = await db.blocks
        .where('uuid')
        .equals(blockExternalId)
        .first();

      if (!currentBlock) {
        return;
      }

      updateBlockLocal({
        ...currentBlock,
        properties: {
          ...currentBlock.properties,
          checked: event.data.blockUpdated.updatePropertyChecked.checked,
        },
      });
    },
    []
  );

  const updatePropertyTitle = useCallback(
    (_event: BlockPropertyTitleUpdatedEvent) => {
      // Do Nothing. This is handled in the Blocks component.
      // TODO: We should probably move that logic here.
    },
    []
  );

  const handleBlockEvent = useCallback(
    async (
      blockExternalId: string,
      event: BlockEvent
    ): Promise<Block | undefined> => {
      storeEventLocal(blockExternalId, event);

      let block: Block | undefined;

      if ('blockCreated' in event.data) {
        block = await createBlock({ ...event, data: { ...event.data } });
      }

      if ('blockUpdated' in event.data) {
        block = await db.blocks.get(blockExternalId);

        if ('updateContent' in event.data.blockUpdated) {
          updateContent({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        } else if ('updateBlockType' in event.data.blockUpdated) {
          updateBlockType({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        } else if ('updatePropertyTitle' in event.data.blockUpdated) {
          updatePropertyTitle({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        } else if ('updatePropertyChecked' in event.data.blockUpdated) {
          updatePropertyChecked({
            ...event,
            data: { ...event.data, blockUpdated: event.data.blockUpdated },
          });
        }
      }

      sendUpdate([{ transaction: [event] }]);

      return block;
    },
    [
      createBlock,
      sendUpdate,
      storeEventLocal,
      updateBlockType,
      updateContent,
      updatePropertyChecked,
      updatePropertyTitle,
    ]
  );

  return {
    handleBlockEvent,
  };
};
