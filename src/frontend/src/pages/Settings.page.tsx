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
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import _ from 'lodash';
import { useMemo, useState } from 'react';

import { PageWrapper } from '@/PageWrapper';
import {
  UserProfileForm,
  UserProfileFormFormValues,
} from '@/components/UserProfileForm';
import { WorkspaceMembers } from '@/components/WorkspaceMembers';
import {
  WorkspaceSettings,
  WorkspaceSettingsFormValues,
} from '@/components/WorkspaceSettings';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useUpdateProfile } from '@/hooks/canisters/user/updates/useUpdateProfile';
import { useUpdateSettings } from '@/hooks/canisters/workspace/updates/useUpdateSettings';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

type SettingsPageTab =
  | 'ACCOUNT_PROFILE'
  | 'WORKSPACE_SETTINGS'
  | 'WORKSPACE_MEMBERS';

export function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsPageTab>('WORKSPACE_SETTINGS');
  const { identity, userId, setProfile } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const [_updateProfile] = useUpdateProfile({ identity, userId });
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

  const updateProfile = useMemo(() => {
    const fn = (input: UserProfileFormFormValues) => {
      setSavingState('saving');

      return _updateProfile([{ username: input.username }])
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
          setProfile((prev) => ({
            ...prev,
            username: input.username,
          }));
        })
        .catch((e) => {
          setSavingState('idle');

          notifications.show({
            title: 'Error updating profile',
            message: e.message,
            color: 'red',
          });
        });
    };

    return fn;
  }, [_updateProfile, setProfile]);

  return (
    <PageWrapper>
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
          <Box w={rem('160px')} h="100%" pr="md" style={{ flexShrink: 0 }}>
            <Menu>
              <Stack gap="lg" h="100%">
                <div>
                  <Menu.Label>Account</Menu.Label>
                  <Stack gap="xs">
                    <NavLink
                      active={activeTab === 'ACCOUNT_PROFILE'}
                      label="My profile"
                      variant="light"
                      onClick={() => {
                        setActiveTab('ACCOUNT_PROFILE');
                      }}
                    />
                  </Stack>
                </div>

                <div>
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
                </div>
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
            {activeTab === 'ACCOUNT_PROFILE' && (
              <UserProfileForm onSubmit={_.debounce(updateProfile, 1000)} />
            )}
            {activeTab === 'WORKSPACE_SETTINGS' && (
              <WorkspaceSettings onSubmit={_.debounce(updateSettings, 1000)} />
            )}
            {activeTab === 'WORKSPACE_MEMBERS' && <WorkspaceMembers />}
          </Stack>
        </Flex>
      </Container>
    </PageWrapper>
  );
}
