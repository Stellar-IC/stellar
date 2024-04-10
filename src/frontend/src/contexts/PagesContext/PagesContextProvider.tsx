import { Principal } from '@dfinity/principal';
import { Tree } from '@stellar-ic/lseq-ts';
import { PropsWithChildren, useCallback, useEffect } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { usePages } from '@/contexts/PagesContext/usePages';
import { db } from '@/db';
import { usePagesQuery } from '@/hooks/canisters/workspace/queries/usePagesQuery';
import { updateBlockLocal } from '@/hooks/documents/useTextBlockKeyboardEventHandlers/utils';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
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
import { useWorkspaceContext } from '../WorkspaceContext/useWorkspaceContext';

import { PagesContext } from './PagesContext';

function buildEvent<DataT>(data: DataT, userId: Principal) {
  const now = BigInt(Date.now()) * BigInt(1_000_000); // convert to nanoseconds

  return {
    data,
    user: userId,
    uuid: parse(v4()),
    timestamp: now,
  };
}

export function PagesContextProvider({ children }: PropsWithChildren<{}>) {
  const { identity, userId } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const queryPages = usePagesQuery({
    identity,
    workspaceId,
  });
  const { handleBlockEvent } = usePages({
    identity,
    workspaceId,
  });

  useEffect(() => {
    queryPages();
  }, [queryPages]);

  const addBlock = useCallback(
    async (
      parentBlockExternalId: UUID,
      blockType: BlockType,
      index: number
    ): Promise<Block> => {
      const blockExternalId = v4();
      const eventExternalId = v4();
      const parsedExternalId = parse(blockExternalId);

      const block = await handleBlockEvent(blockExternalId, {
        user: userId,
        uuid: parse(eventExternalId),
        data: {
          blockCreated: {
            block: {
              uuid: parsedExternalId,
              parent: [parentBlockExternalId],
              blockType,
            },
            index: BigInt(index),
          },
        },
        timestamp: BigInt(Date.now()) * BigInt(1_000_000), // convert from nano to milliseconds
      });

      if (!block) {
        throw new Error('Could not create block');
      }

      return block;
    },
    [handleBlockEvent, userId]
  );

  const removeBlock = useCallback(
    async (parentBlockExternalId: UUID, index: number): Promise<void> => {
      const parentBlock = await db.blocks
        .where('uuid')
        .equals(stringify(parentBlockExternalId))
        .first();

      if (!parentBlock) {
        throw new Error(
          `Could not find parent block with external id ${stringify(
            parentBlockExternalId
          )}`
        );
      }

      const event = Tree.removeCharacter(parentBlock.content, index - 1);
      handleBlockEvent(
        stringify(parentBlockExternalId),
        buildEvent(
          {
            blockUpdated: {
              updateContent: {
                blockExternalId: parentBlockExternalId,
                transaction: [event],
              },
            },
          },
          userId
        )
      );

      updateBlockLocal(parentBlock);
    },
    [handleBlockEvent, userId]
  );

  const updateBlock = useCallback(
    (
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
    ) => {
      if ('updatePropertyChecked' in event) {
        handleBlockEvent(
          stringify(blockExternalId),
          buildEvent(
            {
              blockUpdated: {
                updatePropertyChecked: {
                  ...event.updatePropertyChecked.data,
                },
              },
            },
            userId
          )
        );
      } else if ('updatePropertyTitle' in event) {
        handleBlockEvent(
          stringify(blockExternalId),
          buildEvent(
            {
              blockUpdated: {
                updatePropertyTitle: {
                  ...event.updatePropertyTitle.data,
                },
              },
            },
            userId
          )
        );
      } else if ('updateBlockType' in event) {
        handleBlockEvent(
          stringify(blockExternalId),
          buildEvent(
            {
              blockUpdated: {
                updateBlockType: {
                  ...event.updateBlockType.data,
                },
              },
            },
            userId
          )
        );
      } else if ('updateParent' in event) {
        handleBlockEvent(
          stringify(blockExternalId),
          buildEvent(
            {
              blockUpdated: {
                updateParent: {
                  ...event.updateParent.data,
                },
              },
            },
            userId
          )
        );
      } else if ('updateContent' in event) {
        handleBlockEvent(
          stringify(blockExternalId),
          buildEvent(
            {
              blockUpdated: {
                updateContent: {
                  ...event.updateContent.data,
                },
              },
            },
            userId
          )
        );
      }
    },
    [handleBlockEvent, userId]
  );

  return (
    <PagesContext.Provider
      value={{
        addBlock,
        removeBlock,
        updateBlock,
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}
