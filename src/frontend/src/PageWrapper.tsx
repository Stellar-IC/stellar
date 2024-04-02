import { DelegationIdentity } from '@dfinity/identity';
import type { Principal } from '@dfinity/principal';
import { Loader, Box, Flex, Text } from '@mantine/core';
import { PropsWithChildren, useState, useEffect } from 'react';

import { useLayoutManager } from './LayoutManager';
import { NavbarSearch } from './components/Navbars/NavbarSearch';
import { PageActionBar } from './components/PageActionBar';
import { PageInfoPanel } from './components/PageInfoPanel';
import { PagesContextProvider } from './contexts/PagesContext/PagesContextProvider';
import { WorkspaceContextProvider } from './contexts/WorkspaceContext/WorkspaceContextProvider';
import { useUserActor } from './hooks/canisters/user/useUserActor';
import { useAuthContext } from './modules/auth/contexts/AuthContext';

export function PageWrapper({ children }: PropsWithChildren) {
  const { isLoading, identity, userId } = useAuthContext();
  const { actor: userActor, canisterId } = useUserActor({ identity, userId });
  const [workspaceId, setWorkspaceId] = useState<Principal | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (identity instanceof DelegationIdentity && !canisterId.isAnonymous()) {
        userActor.personalWorkspace().then((result) => {
          if (!('ok' in result)) {
            throw new Error('No default workspace found');
          }
          setWorkspaceId(result.ok);
        });
      }
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [userActor, identity, canisterId]);

  const { layout, layoutManager } = useLayoutManager();

  if (isLoading) {
    return (
      <Flex h="100%">
        <NavbarSearch workspaceId={workspaceId} />
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignContent: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            transition: 'padding 0.2s ease-in-out',
          }}
        >
          <Loader />
        </div>
      </Flex>
    );
  }

  if (!(identity instanceof DelegationIdentity)) {
    return (
      <Flex h="100%">
        <NavbarSearch workspaceId={workspaceId} />
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignContent: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            transition: 'padding 0.2s ease-in-out',
          }}
        />
      </Flex>
    );
  }

  if (!workspaceId) {
    return (
      <Flex h="100%">
        <NavbarSearch workspaceId={workspaceId} />
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignContent: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            transition: 'padding 0.2s ease-in-out',
          }}
        >
          <Text>No Workspace</Text>
        </div>
      </Flex>
    );
  }

  return (
    <WorkspaceContextProvider identity={identity} workspaceId={workspaceId}>
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
    </WorkspaceContextProvider>
  );
}
