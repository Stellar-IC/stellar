import { DelegationIdentity } from '@dfinity/identity';
import { Flex, useMantineTheme } from '@mantine/core';
import { PropsWithChildren } from 'react';

import { ActionBar } from './components/ActionBar';
import { useAuthContext } from './modules/auth/contexts/AuthContext';

type PageWrapperProps = PropsWithChildren<{}>;

export function PageWrapper({ children }: PageWrapperProps) {
  const { identity } = useAuthContext();
  const theme = useMantineTheme();

  if (!(identity instanceof DelegationIdentity)) {
    throw new Error('Anonymous identity is not allowed here');
  }

  return (
    <Flex h="100%">
      <div
        style={{
          width: '100%',
          height: '100%',
          flexGrow: 1,
          transition: 'padding 0.2s ease-in-out',
          overflowY: 'scroll',
          position: 'relative',
        }}
      >
        <ActionBar />
        <div style={{ paddingTop: theme.spacing.lg }}>{children}</div>
      </div>
    </Flex>
  );
}
