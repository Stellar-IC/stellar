import { Box, Flex, Loader } from '@mantine/core';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouteObject,
  RouterProvider,
} from 'react-router-dom';

import { NavbarSearch } from './components/Navbars/NavbarSearch';
import { useAuthContext } from './modules/auth/contexts/AuthContext';
import { HomePage } from './pages/Home.page';
import { SettingsPage } from './pages/Settings.page';
import { SpaceHomePageConnector } from './pages/SpaceHome/SpaceHome.page';
import { SpaceSettingsPageConnector } from './pages/SpaceSettings.page';
import { LandingPage } from './pages/landing/Landing.page';
import { OnboardingPage } from './pages/onboarding/Onboarding.page';
import { PageDetailPageConnector } from './pages/pages/PageDetail.page';

const onboardingRoutes: RouteObject[] = [
  { path: '/', element: <OnboardingPage /> },
  { path: '*', element: <Navigate to="/" /> },
];
const onboardingRouter = createBrowserRouter(onboardingRoutes);

const unauthenticatedRoutes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  {
    path: '/spaces/:spaceId/',
    children: [
      {
        path: '/spaces/:spaceId/',
        element: <SpaceHomePageConnector />,
      },
      {
        path: '/spaces/:spaceId/pages/:pageId',
        element: <PageDetailPageConnector />,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" /> },
];
const unauthenticatedRouter = createBrowserRouter(unauthenticatedRoutes);

const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Box w="100%" h="100%">
        <Flex h="100%">
          <NavbarSearch />
          <Box w="100%" h="100%">
            <Outlet />
          </Box>
        </Flex>
      </Box>
    ),
    children: [
      { index: true, element: <HomePage /> },
      {
        path: '/spaces/:spaceId/',
        children: [
          {
            path: '/spaces/:spaceId/',
            element: <SpaceHomePageConnector />,
          },
          {
            path: '/spaces/:spaceId/pages/:pageId',
            element: <PageDetailPageConnector />,
          },
          {
            path: '/spaces/:spaceId/settings',
            element: <SpaceSettingsPageConnector />,
          },
        ],
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
];
const authenticatedRouter = createBrowserRouter(authenticatedRoutes);

export function AppRouter() {
  const { isAuthenticated, profile, isLoading } = useAuthContext();

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
        router={onboardingRouter}
        fallbackElement={<>Page Not Found</>}
      />
    );
  }

  return isAuthenticated ? (
    <RouterProvider
      router={authenticatedRouter}
      fallbackElement={<>Page Not Found</>}
    />
  ) : (
    <RouterProvider
      router={unauthenticatedRouter}
      fallbackElement={<>Page Not Found</>}
    />
  );
}
