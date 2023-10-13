import { PropsWithChildren } from 'react';
import { usePages } from '@/hooks/documents/queries/usePages';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { parse, v4 } from 'uuid';
import { PagesContext } from './PagesContext';
import { useWorkspaceContext } from '../WorkspaceContext/useWorkspaceContext';

export function PagesContextProvider({ children }: PropsWithChildren<{}>) {
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();

  const {
    pages: pagesContext,
    blocks: blocksContext,
    handleBlockEvent,
    insertCharacter,
    removeCharacter,
  } = usePages({ identity, workspaceId });

  return (
    <PagesContext.Provider
      value={{
        pages: pagesContext,
        blocks: blocksContext,
        addBlock: (pageExternalId, blockType, index) => {
          handleBlockEvent(pageExternalId, {
            blockCreated: {
              user: identity.getPrincipal(),
              uuid: pageExternalId,
              data: {
                block: {
                  uuid: parse(v4()),
                  parent: [pageExternalId],
                  blockType,
                },
                index: BigInt(index),
              },
            },
          });
        },
        removeBlock: (pageExternalId, blockExternalId) => {
          handleBlockEvent(pageExternalId, {
            blockRemoved: {
              user: identity.getPrincipal(),
              uuid: pageExternalId,
              data: {
                parent: pageExternalId,
                blockExternalId,
              },
            },
          });
        },
        updateBlock: (pageExternalId, blockExternalId, event) => {
          if ('updatePropertyTitle' in event) {
            handleBlockEvent(pageExternalId, {
              blockUpdated: {
                updatePropertyTitle: {
                  ...event.updatePropertyTitle,
                  user: identity.getPrincipal(),
                  uuid: pageExternalId,
                },
              },
            });
          } else if ('updateBlockType' in event) {
            handleBlockEvent(pageExternalId, {
              blockUpdated: {
                updateBlockType: {
                  ...event.updateBlockType,
                  user: identity.getPrincipal(),
                  uuid: pageExternalId,
                },
              },
            });
          }
        },
        insertCharacter,
        removeCharacter,
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}
