import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';

import { theme } from '@/theme';
import { QueryContextProvider } from '@/contexts/QueryContext/QueryContextProvider';
import { AuthContextProvider } from '@/modules/auth/contexts/AuthContext';

import { Notifications } from '@mantine/notifications';
import { AppRouter } from './AppRouter';
import { DataStoreContextProvider } from './contexts/DataStoreContext/DataStoreContextProvider';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <DataStoreContextProvider>
        <QueryContextProvider>
          <AuthContextProvider>
            <Notifications />
            <AppRouter />
          </AuthContextProvider>
        </QueryContextProvider>
      </DataStoreContextProvider>
    </MantineProvider>
  );
}
