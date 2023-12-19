import { PropsWithChildren, useCallback } from 'react';
import { usePages } from '@/contexts/PagesContext/usePages';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { parse, stringify, v4 } from 'uuid';
import { Tree } from '@stellar-ic/lseq-ts';
import { PagesContext } from './PagesContext';
import { useWorkspaceContext } from '../WorkspaceContext/useWorkspaceContext';
import {
  BlockType,
  UUID,
} from '../../../../declarations/workspace/workspace.did';
import { BlockEvent } from './types';

export function PagesContextProvider({ children }: PropsWithChildren<{}>) {
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();

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

      handleBlockEvent(blockExternalId, {
        blockCreated: {
          user: identity.getPrincipal(),
          uuid: parse(eventExternalId),
          data: {
            block: {
              uuid: parsedExternalId,
              parent: [parentBlockExternalId],
              blockType,
            },
            index: BigInt(index),
          },
        },
      });
    },
    [handleBlockEvent, identity]
  );

  const removeBlock = useCallback(
    (parentBlockExternalId: UUID, index: number) => {
      const parentBlock =
        pagesContext.data[stringify(parentBlockExternalId)] ||
        blocksContext.data[stringify(parentBlockExternalId)];
      Tree.removeCharacter(parentBlock.content, index, (event) => {
        handleBlockEvent(stringify(parentBlockExternalId), {
          blockUpdated: {
            updateContent: {
              uuid: parse(v4()),
              user: identity.getPrincipal(),
              data: {
                blockExternalId: parentBlockExternalId,
                transaction: [event],
              },
            },
          },
        });
      });
      blocksContext.updateLocal(stringify(parentBlockExternalId), parentBlock);
      if ('page' in parentBlock.blockType) {
        pagesContext.updateLocal(stringify(parentBlockExternalId), parentBlock);
      }
    },
    [blocksContext, handleBlockEvent, identity, pagesContext]
  );

  const updateBlock = useCallback(
    (blockExternalId: UUID, event: BlockEvent) => {
      if ('updateProperty' in event) {
        if ('title' in event.updateProperty) {
          handleBlockEvent(stringify(blockExternalId), {
            blockUpdated: {
              updatePropertyTitle: {
                ...event.updateProperty.title,
                user: identity.getPrincipal(),
                uuid: parse(v4()),
              },
            },
          });
        } else if ('checked' in event.updateProperty) {
          handleBlockEvent(stringify(blockExternalId), {
            blockUpdated: {
              updatePropertyChecked: {
                ...event.updateProperty.checked,
                user: identity.getPrincipal(),
                uuid: parse(v4()),
              },
            },
          });
        }
      } else if ('updateBlockType' in event) {
        handleBlockEvent(stringify(blockExternalId), {
          blockUpdated: {
            updateBlockType: {
              ...event.updateBlockType,
              user: identity.getPrincipal(),
              uuid: parse(v4()),
            },
          },
        });
      } else if ('updateParent' in event) {
        handleBlockEvent(stringify(blockExternalId), {
          blockUpdated: {
            updateParent: {
              ...event.updateParent,
              user: identity.getPrincipal(),
              uuid: parse(v4()),
            },
          },
        });
      } else if ('updateContent' in event) {
        handleBlockEvent(stringify(blockExternalId), {
          blockUpdated: {
            updateContent: {
              ...event.updateContent,
              user: identity.getPrincipal(),
              uuid: parse(v4()),
            },
          },
        });
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
