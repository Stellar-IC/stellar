import '@mantine/core/styles.css';
import type { Principal } from '@dfinity/principal';
import { Box, Flex, Loader, Text } from '@mantine/core';
import { PropsWithChildren } from 'react';

import { NavbarSearch } from '@/components/Navbars/NavbarSearch';
import { PagesContextProvider } from '@/contexts/PagesContext/PagesContextProvider';
import { DelegationIdentity } from '@dfinity/identity';
import { Identity } from '@dfinity/agent';
import { WorkspaceContextProvider } from './contexts/WorkspaceContext/WorkspaceContextProvider';

export function AppBody({
  children,
  identity,
  workspaceId,
  isLoading,
}: PropsWithChildren<{
  workspaceId?: Principal | null;
  identity?: Identity;
  isLoading: boolean;
}>) {
  if (isLoading) {
    return <Loader />;
  }

  if (!(identity instanceof DelegationIdentity)) {
    return null;
  }

  if (!workspaceId) {
    return <Text>No Workspace</Text>;
  }

  return (
    <WorkspaceContextProvider identity={identity} workspaceId={workspaceId}>
      <PagesContextProvider>
        <Box w="100%">
          <Flex>
            <NavbarSearch workspaceId={workspaceId} />
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                alignContent: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                paddingLeft: '300px', // TODO: Convert this to rems
              }}
            >
              {children}
            </div>
          </Flex>
        </Box>
      </PagesContextProvider>
    </WorkspaceContextProvider>
  );
}
