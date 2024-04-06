import { DelegationIdentity } from '@dfinity/identity';
import { ActionIcon, Box, Flex, useMantineTheme } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';

import { useLayoutManager } from './LayoutManager';
import { ActionBar } from './components/ActionBar';
import { NavbarSearch } from './components/Navbars/NavbarSearch';
import { PageInfoPanel } from './components/PageInfoPanel';
import { PagesContextProvider } from './contexts/PagesContext/PagesContextProvider';
import { useWorkspaceContext } from './contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from './modules/auth/contexts/AuthContext';

export function PageWrapper({
  children,
  shouldShowPageActions,
}: PropsWithChildren<{
  shouldShowPageActions?: boolean;
}>) {
  const { identity } = useAuthContext();
  const { layout, layoutManager } = useLayoutManager();
  const { workspaceId } = useWorkspaceContext();
  const theme = useMantineTheme();

  const openActivityLog = () => {
    if (layout === 'PANEL_OPEN') {
      layoutManager.layout = 'CLOSED';
    } else layoutManager.layout = 'PANEL_OPEN';
  };

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
            <ActionBar
              additionalActions={
                shouldShowPageActions ? (
                  <ActionIcon variant="subtle" onClick={openActivityLog}>
                    <IconHistory />
                  </ActionIcon>
                ) : null
              }
            />
            <div style={{ paddingTop: theme.spacing.lg }}>{children}</div>
          </div>
          <PageInfoPanel />
        </Flex>
      </Box>
    </PagesContextProvider>
  );
}
