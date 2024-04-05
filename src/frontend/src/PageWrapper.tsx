import { DelegationIdentity } from '@dfinity/identity';
import { Box, Flex } from '@mantine/core';
import { PropsWithChildren } from 'react';

import { useLayoutManager } from './LayoutManager';
import { NavbarSearch } from './components/Navbars/NavbarSearch';
import { PageActionBar } from './components/PageActionBar';
import { PageInfoPanel } from './components/PageInfoPanel';
import { PagesContextProvider } from './contexts/PagesContext/PagesContextProvider';
import { useWorkspaceContext } from './contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from './modules/auth/contexts/AuthContext';

export function PageWrapper({ children }: PropsWithChildren) {
  const { identity } = useAuthContext();
  const { layout, layoutManager } = useLayoutManager();
  const { workspaceId } = useWorkspaceContext();

  if (!(identity instanceof DelegationIdentity)) {
    throw new Error('Anonymous identity is not allowed here');
  }

  return (
    <PagesContextProvider>
      <Box w="100%" h="100%">
        <Flex h="100%">
          <NavbarSearch workspaceId={workspaceId} />
          <div
            style={{
              width: '100%',
              height: '100%',
              flexGrow: 1,
              transition: 'padding 0.2s ease-in-out',
              overflowY: 'scroll',
            }}
          >
            <PageActionBar
              openActivityLog={() => {
                if (layout === 'PANEL_OPEN') {
                  layoutManager.layout = 'CLOSED';
                } else layoutManager.layout = 'PANEL_OPEN';
              }}
            />
            {children}
          </div>
          <PageInfoPanel />
        </Flex>
      </Box>
    </PagesContextProvider>
  );
}
