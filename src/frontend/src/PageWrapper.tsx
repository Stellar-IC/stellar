import { DelegationIdentity } from '@dfinity/identity';
import type { Principal } from '@dfinity/principal';
import { Loader, Box, Flex, Text } from '@mantine/core';
import { PropsWithChildren, useState, useEffect } from 'react';

import { NavbarSearch } from './components/Navbars/NavbarSearch';
import { PageActionBar } from './components/PageActionBar';
import { PageInfoPanel } from './components/PageInfoPanel';
import { PagesContextProvider } from './contexts/PagesContext/PagesContextProvider';
import { WorkspaceContextProvider } from './contexts/WorkspaceContext/WorkspaceContextProvider';
import { useUserActor } from './hooks/ic/user/useUserActor';
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

  if (isLoading) {
    return (
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
            paddingRight: '300px', // TODO: Convert this to rems
          }}
        >
          <Loader />
        </div>
      </Flex>
    );
  }

  if (!(identity instanceof DelegationIdentity)) {
    return (
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
            paddingRight: '300px', // TODO: Convert this to rems
          }}
        />
      </Flex>
    );
  }

  if (!workspaceId) {
    return (
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
            paddingRight: '300px', // TODO: Convert this to rems
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
        <Box w="100%">
          <PageActionBar openActivityLog={() => {}} />
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
                marginTop: '45px',
                paddingLeft: '300px', // TODO: Convert this to rems
                paddingRight: '300px', // TODO: Convert this to rems
              }}
            >
              {children}
            </div>
            <PageInfoPanel />
          </Flex>
        </Box>
      </PagesContextProvider>
    </WorkspaceContextProvider>
  );
}
