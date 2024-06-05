import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Container,
  Flex,
  Loader,
  Menu,
  NavLink,
  rem,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { WorkspaceMembers } from '@/components/WorkspaceMembers';
import {
  WorkspaceSettings,
  WorkspaceSettingsFormValues,
} from '@/components/WorkspaceSettings';
import { WorkspaceContextProvider } from '@/contexts/WorkspaceContext/WorkspaceContextProvider';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useUpdateSettings } from '@/hooks/canisters/workspace/updates/useUpdateSettings';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

type SettingsPageTab =
  | 'ACCOUNT_PROFILE'
  | 'WORKSPACE_SETTINGS'
  | 'WORKSPACE_MEMBERS';

export function SpaceSettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsPageTab>('WORKSPACE_SETTINGS');
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const [_updateSettings] = useUpdateSettings({ identity, workspaceId });
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'success'>(
    'idle'
  );

  const updateSettings = useMemo(() => {
    const fn = (input: WorkspaceSettingsFormValues) => {
      setSavingState('saving');

      return _updateSettings([
        {
          name: [input.name],
          visibility: [input.visibility],
          description: [input.description],
          websiteLink: [input.websiteLink],
        },
      ])
        .then((res) => {
          if ('err' in res) {
            setSavingState('idle');

            notifications.show({
              title: 'Error saving settings',
              message: JSON.stringify(res.err),
              color: 'red',
            });
          }

          setSavingState('success');
          setTimeout(() => {
            setSavingState('idle');
          }, 1000);
          notifications.show({
            title: 'Settings saved',
            message: 'Your workspace settings have been saved',
            color: 'blue',
          });
        })
        .catch((e) => {
          setSavingState('idle');

          notifications.show({
            title: 'Error saving settings',
            message: e.message,
            color: 'red',
          });
        });
    };

    return fn;
  }, [_updateSettings]);

  return (
    <Container
      style={{
        position: 'absolute',
        top: rem('48px'), // 48px is the height of the action bar
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Flex gap="lg" h="100%">
        <Box w={rem('160px')} h="100%" pt="md" style={{ flexShrink: 0 }}>
          <Menu>
            <Menu.Label>Workspace</Menu.Label>
            <Stack gap="xs">
              <NavLink
                active={activeTab === 'WORKSPACE_SETTINGS'}
                label="Settings"
                variant="light"
                onClick={() => {
                  setActiveTab('WORKSPACE_SETTINGS');
                }}
              />
              <NavLink
                active={activeTab === 'WORKSPACE_MEMBERS'}
                label="People"
                variant="light"
                onClick={() => {
                  setActiveTab('WORKSPACE_MEMBERS');
                }}
              />
            </Stack>
          </Menu>
        </Box>

        <Stack style={{ flexGrow: 1 }}>
          <Flex justify="space-between" align="center">
            <Text size="xs">
              {savingState === 'saving' && 'Saving...'}
              {savingState === 'success' && 'Saved!'}
            </Text>
            {savingState === 'saving' && (
              <div>
                <Loader size="xs" />
              </div>
            )}
          </Flex>
          {activeTab === 'WORKSPACE_SETTINGS' && (
            <WorkspaceSettings onSubmit={_.debounce(updateSettings, 1000)} />
          )}
          {activeTab === 'WORKSPACE_MEMBERS' && <WorkspaceMembers />}
        </Stack>
      </Flex>
    </Container>
  );
}

export function SpaceSettingsPageConnector() {
  const { identity } = useAuthContext();
  const { spaceId } = useParams<{ spaceId: string }>();

  if (!spaceId) throw new Error('Missing workspaceId');

  if (!(identity instanceof DelegationIdentity)) {
    throw new Error('Anonymous identity is not allowed here');
  }

  const workspaceId = Principal.fromText(spaceId);

  return (
    <WorkspaceContextProvider identity={identity} workspaceId={workspaceId}>
      <SpaceSettingsPage />
    </WorkspaceContextProvider>
  );
}
