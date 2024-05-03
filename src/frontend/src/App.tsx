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

const AppShell = ({ children }: { children: React.ReactNode }) => (
  <div className="AppShell">{children}</div>
);

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AuthContextProvider>
        <QueryContextProvider>
          <SettingsContextProvider>
            <Notifications />
            <AppShell>
              <AppRouter />
            </AppShell>
          </SettingsContextProvider>
        </QueryContextProvider>
      </AuthContextProvider>
    </MantineProvider>
  );
}
