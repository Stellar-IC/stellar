import { Identity } from '@dfinity/agent';
import { Tree } from '@stellar-ic/lseq-ts';
import { PropsWithChildren, useCallback } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { usePages } from '@/contexts/PagesContext/usePages';
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
import { useDataStoreContext } from '../DataStoreContext/useDataStoreContext';
import { useWorkspaceContext } from '../WorkspaceContext/useWorkspaceContext';

import { PagesContext } from './PagesContext';

function buildEvent<DataT>(data: DataT, userIdentity: Identity) {
  const now = BigInt(Date.now()) * BigInt(1_000_000); // convert to nanoseconds

  return {
    data,
    user: userIdentity.getPrincipal(),
    uuid: parse(v4()),
    timestamp: now,
  };
}

export function PagesContextProvider({ children }: PropsWithChildren<{}>) {
  const { identity, userId } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const { get } = useDataStoreContext();

  const {
    pages: pagesContext,
    blocks: blocksContext,
    handleBlockEvent,
  } = usePages({ identity, workspaceId });

  const addBlock = useCallback(
    (parentBlockExternalId: UUID, blockType: BlockType, index: number) => {
      const blockExternalId = v4();
      const eventExternalId = v4();
      const parsedExternalId = parse(blockExternalId);

      const block = handleBlockEvent(blockExternalId, {
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
        timestamp: BigInt(Date.now()),
      });

      if (!block) {
        throw new Error('Could not create block');
      }

      return block;
    },
    [handleBlockEvent, identity]
  );

  const removeBlock = useCallback(
    (parentBlockExternalId: UUID, index: number) => {
      const parentBlock =
        get<Block>(DATA_TYPES.page, stringify(parentBlockExternalId)) ||
        get<Block>(DATA_TYPES.block, stringify(parentBlockExternalId));

      if (!parentBlock) {
        throw new Error(
          `Could not find parent block with external id ${parentBlockExternalId}`
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
          identity
        )
      );

      blocksContext.updateLocal(stringify(parentBlockExternalId), parentBlock);
      if ('page' in parentBlock.blockType) {
        pagesContext.updateLocal(stringify(parentBlockExternalId), parentBlock);
      }
    },
    [get, blocksContext, pagesContext, handleBlockEvent, identity]
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
            identity
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
            identity
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
            identity
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
            identity
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
            identity
          )
        );
      }
    },
    [handleBlockEvent, identity]
  );

  return (
    <PagesContext.Provider
      value={{
        pages: pagesContext,
        blocks: blocksContext,
        addBlock,
        removeBlock,
        updateBlock,
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}
