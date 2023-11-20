import { PropsWithChildren } from 'react';
import { usePages } from '@/contexts/blocks/usePages';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { parse, stringify, v4 } from 'uuid';
import { Tree } from '@/modules/lseq';
import { PagesContext } from './PagesContext';
import { useWorkspaceContext } from '../WorkspaceContext/useWorkspaceContext';

export function PagesContextProvider({ children }: PropsWithChildren<{}>) {
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();

  const {
    pages: pagesContext,
    blocks: blocksContext,
    handleBlockEvent,
  } = usePages({ identity, workspaceId });

  return (
    <PagesContext.Provider
      value={{
        pages: pagesContext,
        blocks: blocksContext,
        addBlock: (parentBlockExternalId, blockType, index) => {
          const blockExternalId = v4();
          const page = pagesContext.data[stringify(parentBlockExternalId)];
          Tree.insertCharacter(
            page.content,
            index,
            blockExternalId,
            (events) => {
              handleBlockEvent(parentBlockExternalId, {
                blockCreated: {
                  user: identity.getPrincipal(),
                  uuid: parentBlockExternalId,
                  data: {
                    block: {
                      uuid: parse(blockExternalId),
                      parent: [parentBlockExternalId],
                      blockType,
                    },
                    index: BigInt(index),
                  },
                },
              });
              handleBlockEvent(parentBlockExternalId, {
                blockUpdated: {
                  updateContent: {
                    user: identity.getPrincipal(),
                    uuid: parentBlockExternalId,
                    data: { transaction: events },
                  },
                },
              });
            }
          );
        },

        removeBlock: (parentBlockExternalId, index) => {
          const page = pagesContext.data[stringify(parentBlockExternalId)];
          Tree.removeCharacter(page.content, index, (event) => {
            handleBlockEvent(parentBlockExternalId, {
              blockUpdated: {
                updateContent: {
                  user: identity.getPrincipal(),
                  uuid: parentBlockExternalId,
                  data: { transaction: [event] },
                },
              },
            });
          });
        },

        updateBlock: (blockExternalId, event) => {
          if ('updateProperty' in event) {
            if ('title' in event.updateProperty) {
              handleBlockEvent(blockExternalId, {
                blockUpdated: {
                  updatePropertyTitle: {
                    ...event.updateProperty.title,
                    user: identity.getPrincipal(),
                    uuid: blockExternalId,
                  },
                },
              });
            } else if ('checked' in event.updateProperty) {
              handleBlockEvent(blockExternalId, {
                blockUpdated: {
                  updatePropertyChecked: {
                    ...event.updateProperty.checked,
                    user: identity.getPrincipal(),
                    uuid: blockExternalId,
                  },
                },
              });
            }
          } else if ('updateBlockType' in event) {
            handleBlockEvent(blockExternalId, {
              blockUpdated: {
                updateBlockType: {
                  ...event.updateBlockType,
                  user: identity.getPrincipal(),
                  uuid: blockExternalId,
                },
              },
            });
          }
        },
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}
