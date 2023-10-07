import '@mantine/core/styles.css';
import { Box, Flex, MantineProvider } from '@mantine/core';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { theme } from '@/theme';
import { QueryContextProvider } from '@/contexts/QueryContext/QueryContextProvider';
import { AuthContextProvider } from '@/modules/auth/contexts/AuthContext';
import { HomePage } from '@/pages/Home.page';
import { PageDetailPage } from '@/pages/pages/PageDetail.page';
import { NavbarSearch } from '@/components/Navbars/NavbarSearch';
import { PagesContextProvider } from '@/contexts/blocks/PagesContextProvider';

function AppBody({ children }: PropsWithChildren) {
  return <Box w="100%">{children}</Box>;
}

function PageWrapper({ children }: PropsWithChildren) {
  return (
    <>
      <AppBody>
        <Flex>
          <NavbarSearch />
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              alignContent: 'center',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            {children}
          </div>
        </Flex>
      </AppBody>
    </>
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
    <MantineProvider theme={theme}>
      <QueryContextProvider>
        <AuthContextProvider>
          <PagesContextProvider>
            <AppRouter />
          </PagesContextProvider>
        </AuthContextProvider>
      </QueryContextProvider>
    </MantineProvider>
  );
}
