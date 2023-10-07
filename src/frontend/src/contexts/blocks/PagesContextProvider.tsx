import { PropsWithChildren } from 'react';
import { useBlocks } from '@/hooks/documents/queries/useBlocks';
import { usePages } from '@/hooks/documents/queries/usePages';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { PagesContext } from './PagesContext';

export function PagesContextProvider({ children }: PropsWithChildren<{}>) {
  const { identity } = useAuthContext();

  const {
    data: blocks,
    query: queryBlock,
    updateLocal: updateLocalBlock,
  } = useBlocks({ identity });

  const {
    pages,
    query: queryPage,
    updateLocal: updateLocalPage,
    handleBlockEvent,
  } = usePages({ identity, updateLocalBlock });

  return (
    <PagesContext.Provider
      value={{
        pages: {
          data: pages,
          query: queryPage,
          updateLocal: updateLocalPage,
        },
        blocks: {
          data: blocks,
          query: queryBlock,
          updateLocal: updateLocalBlock,
        },
        addBlock: (pageExternalId, blockType, index) => {
          handleBlockEvent(pageExternalId, {
            type: 'addBlock',
            data: { blockType, index },
          });
        },
        removeBlock: (pageExternalId, blockExternalId) => {
          handleBlockEvent(pageExternalId, {
            type: 'removeBlock',
            data: { blockExternalId },
          });
        },
        updateBlock: (pageExternalId, blockExternalId, transactions) => {
          handleBlockEvent(pageExternalId, {
            type: 'updateBlock',
            data: { blockExternalId, transactions },
          });
        },
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}
