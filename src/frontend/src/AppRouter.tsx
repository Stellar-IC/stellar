import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { Flex, Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouteObject,
  RouterProvider,
} from 'react-router-dom';

import { WorkspaceContextProvider } from './contexts/WorkspaceContext/WorkspaceContextProvider';
import { useUserActor } from './hooks/canisters/user/useUserActor';
import { useAuthContext } from './modules/auth/contexts/AuthContext';
import { HomePage } from './pages/Home.page';
import { SettingsPage } from './pages/Settings.page';
import { LandingPage } from './pages/landing/Landing.page';
import { OnboardingPage } from './pages/onboarding/Onboarding.page';
import { PageDetailPage } from './pages/pages/PageDetail.page';

const unauthenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
  { path: '*', element: <Navigate to="/" /> },
];
const unauthenticatedRouter = createBrowserRouter(unauthenticatedRoutes);

const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/pages/:pageId',
    element: <PageDetailPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
];
const authenticatedRouter = createBrowserRouter(authenticatedRoutes);

const onboardingRoutes: RouteObject[] = [
  {
    path: '/',
    element: <OnboardingPage />,
  },
  { path: '*', element: <Navigate to="/" /> },
];

function WorkspaceLoader({
  children,
}: {
  children: (props: {
    isLoading: boolean;
    workspaceId: Principal;
  }) => React.ReactNode;
}) {
  const [workspaceId, setWorkspaceId] = useState<Principal | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(true);
  const {
    isLoading: isLoadingUser,
    identity,
    userId,
    isAuthenticated,
  } = useAuthContext();
  const { actor: userActor } = useUserActor({ identity, userId });
  const isLoading = isLoadingUser || isLoadingWorkspace;

  // Load the user's personal workspace
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (isAuthenticated) {
        const result = await userActor.personalWorkspace();
        setIsLoadingWorkspace(false);
        if (!('ok' in result)) {
          throw new Error('No default workspace found');
        }
        setWorkspaceId(result.ok);
      }
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [userActor, identity, isAuthenticated]);

  if (!workspaceId) return <></>;

  return <>{children({ isLoading, workspaceId })}</>;
}

export function AppRouter() {
  const { isAuthenticated, identity, profile, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <Flex h="100%" align="center" justify="center">
        <Loader />
      </Flex>
    );
  }

  if (isAuthenticated && !profile.username) {
    return (
      <RouterProvider
        router={createBrowserRouter(onboardingRoutes)}
        fallbackElement={<>Page Not Found</>}
      />
    );
  }

  return isAuthenticated ? (
    <WorkspaceLoader>
      {({ isLoading, workspaceId }) => {
        if (isLoading) {
          return (
            <Flex h="100%">
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
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

        if (!workspaceId) {
          throw new Error('Workspace ID is not set');
        }

        if (!(identity instanceof DelegationIdentity)) {
          throw new Error('Anonymous identity is not allowed here');
        }

        return (
          <WorkspaceContextProvider
            identity={identity}
            workspaceId={workspaceId}
          >
            <RouterProvider
              router={authenticatedRouter}
              fallbackElement={<>Page Not Found</>}
            />
          </WorkspaceContextProvider>
        );
      }}
    </WorkspaceLoader>
  ) : (
    <RouterProvider
      router={unauthenticatedRouter}
      fallbackElement={<>Page Not Found</>}
    />
  );
}
