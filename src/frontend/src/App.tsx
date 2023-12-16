import '@mantine/core/styles.css';
import type { Principal } from '@dfinity/principal';
import { Box, Flex, Loader, MantineProvider } from '@mantine/core';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PropsWithChildren, useEffect, useState } from 'react';
import { theme } from '@/theme';
import { QueryContextProvider } from '@/contexts/QueryContext/QueryContextProvider';
import {
  AuthContextProvider,
  useAuthContext,
} from '@/modules/auth/contexts/AuthContext';
import { HomePage } from '@/pages/Home.page';
import { PageDetailPage } from '@/pages/pages/PageDetail.page';
import { NavbarSearch } from '@/components/Navbars/NavbarSearch';
import { PagesContextProvider } from '@/contexts/blocks/PagesContextProvider';
import { DelegationIdentity } from '@dfinity/identity';
import { WorkspaceContextProvider } from './contexts/WorkspaceContext/WorkspaceContextProvider';
import { useUserActor } from './hooks/ic/actors/useUserActor';

function AppBody({
  children,
  workspaceId,
}: PropsWithChildren<{ workspaceId?: Principal }>) {
  return (
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
  );
}

function PageWrapper({ children }: PropsWithChildren) {
  const { isLoading, identity, userId } = useAuthContext();
  const { actor: userActor, canisterId } = useUserActor({ identity, userId });

  const [workspaceId, setWorkspaceId] = useState<Principal | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (identity instanceof DelegationIdentity && !canisterId.isAnonymous()) {
        userActor
          .personalWorkspace()
          .then((result) => {
            if (!('ok' in result)) {
              throw new Error('No default workspace found');
            }
            setWorkspaceId(result.ok);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [userActor, identity, canisterId]);

  if (isLoading) {
    return (
      <AppBody>
        <Loader />
      </AppBody>
    );
  }

  if (!(identity instanceof DelegationIdentity)) {
    return <AppBody />;
  }

  if (!workspaceId) {
    return <AppBody>No Workspace</AppBody>;
  }

  return (
    <WorkspaceContextProvider identity={identity} workspaceId={workspaceId}>
      <PagesContextProvider>
        <AppBody workspaceId={workspaceId}>{children}</AppBody>
      </PagesContextProvider>
    </WorkspaceContextProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PageWrapper>
        <HomePage />
      </PageWrapper>
    ),
  },
  {
    path: '/pages/:pageId',
    element: (
      <PageWrapper>
        <PageDetailPage />
      </PageWrapper>
    ),
  },
]);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <QueryContextProvider>
        <AuthContextProvider>
          <AppRouter />
        </AuthContextProvider>
      </QueryContextProvider>
    </MantineProvider>
  );
}
