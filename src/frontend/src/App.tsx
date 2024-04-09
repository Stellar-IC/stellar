import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import { QueryContextProvider } from '@/contexts/QueryContext/QueryContextProvider';
import { SettingsContextProvider } from '@/contexts/SettingsContext';
import { AuthContextProvider } from '@/modules/auth/contexts/AuthContext';
import { theme } from '@/theme';

import { AppRouter } from './AppRouter';

import './App.css';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AuthContextProvider>
        <QueryContextProvider>
          <SettingsContextProvider>
            <Notifications />
            <AppRouter />
          </SettingsContextProvider>
        </QueryContextProvider>
      </AuthContextProvider>
    </MantineProvider>
  );
}
