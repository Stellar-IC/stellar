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

import { ActionBar } from '@/components/ActionBar';
import { AppearanceSettingsForm } from '@/components/AppearanceSettingsForm';
import {
  UserProfileForm,
  UserProfileFormFormValues,
} from '@/components/UserProfileForm';
import { useUpdateProfile } from '@/hooks/canisters/user/updates/useUpdateProfile';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

const TABS = {
  ACCOUNT_PROFILE: 'ACCOUNT_PROFILE',
  APPEARANCE: 'APPEARANCE',
} as const;

type TabName = keyof typeof TABS;

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabName>('ACCOUNT_PROFILE');
  const { identity, userId, setProfile } = useAuthContext();
  const [_updateProfile] = useUpdateProfile({ identity, userId });
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'success'>(
    'idle'
  );

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
    <div>
      <ActionBar />
      <Container>
        <Flex gap="lg" h="100%" pt="xl">
          <Box w={rem('160px')} h="100%" pr="md" style={{ flexShrink: 0 }}>
            <Menu>
              <Stack gap="xs">
                <NavLink
                  active={activeTab === TABS.ACCOUNT_PROFILE}
                  label="My profile"
                  variant="light"
                  onClick={() => {
                    setActiveTab(TABS.ACCOUNT_PROFILE);
                  }}
                />
                <NavLink
                  active={activeTab === TABS.APPEARANCE}
                  label="Theme & appearance"
                  variant="light"
                  onClick={() => {
                    setActiveTab(TABS.APPEARANCE);
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
            {activeTab === TABS.ACCOUNT_PROFILE && (
              <UserProfileForm onSubmit={_.debounce(updateProfile, 1000)} />
            )}
            {activeTab === TABS.APPEARANCE && <AppearanceSettingsForm />}
          </Stack>
        </Flex>
      </Container>
    </div>
  );
}
