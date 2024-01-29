import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { PageDetailPage } from './pages/pages/PageDetail.page';
import { SettingsPage } from './pages/Settings.page';
import { PageWrapper } from './PageWrapper';

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
  {
    path: '/settings',
    element: (
      <PageWrapper>
        <SettingsPage />
      </PageWrapper>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
