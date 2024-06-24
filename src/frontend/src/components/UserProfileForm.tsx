import { Box, Flex, InputLabel, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCallback } from 'react';

import { useUserActor } from '@/hooks/canisters/user/useUserActor';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { IcImage } from './IcImage';

export type UserProfileFormFormValues = {
  username: string;
};

interface UserProfileFormProps {
  onSubmit: (input: UserProfileFormFormValues) => void;
  setLoadingState: (state: 'idle' | 'saving' | 'success') => void;
}

export const UserProfileForm = ({
  onSubmit,
  setLoadingState,
}: UserProfileFormProps) => {
  const { identity, userId } = useAuthContext();
  const { actor: userActor } = useUserActor({ identity, userId });
  const { profile, setProfile } = useAuthContext();
  const form = useForm({
    initialValues: {
      username: profile?.username || '',
    },
    validate: {
      // username: (value) => (/^\w+$/.test(value) ? null : 'Invalid username'),
    },
  });

  const setAvatar = useCallback(
    (file: File) =>
      file
        .arrayBuffer()
        .then((buffer) =>
          userActor.setAvatar({
            name: file.name,
            content: new Uint8Array(buffer),
            content_type: file.type,
          })
        )
        .then((res) => {
          if ('ok' in res) {
            const avatarUrl = res.ok.avatarUrl[0];

            if (avatarUrl) {
              setProfile({ ...profile, avatarUrl: [avatarUrl] });
            }
          } else {
            throw new Error(`Failed to set avatar. ${JSON.stringify(res.err)}`);
          }
        }),
    [profile, setProfile, userActor]
  );

  const onAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLoadingState('saving');
        setAvatar(file)
          .then(() => {
            setLoadingState('success');
          })
          .catch((e) => {
            notifications.show({
              title: 'Error',
              message: e.message,
              color: 'red',
            });
            setLoadingState('idle');
          });
      }
    },
    [setAvatar, setLoadingState]
  );

  const onUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      form.getInputProps('username').onChange(e.currentTarget.value);
      onSubmit({
        username: e.currentTarget.value,
      });
    },
    [form, onSubmit]
  );

  return (
    <Box pos="relative">
      <form>
        <Stack>
          <Flex>
            <InputLabel>
              <IcImage src={profile.avatarUrl[0]} fallbackSrc="/user.png" />
              <input hidden type="file" onChange={onAvatarChange} />
            </InputLabel>
          </Flex>
          <TextInput
            label="Username"
            name="username"
            w="100%"
            {...form.getInputProps('username')}
            onChange={onUsernameChange}
          />
        </Stack>
      </form>
    </Box>
  );
};
