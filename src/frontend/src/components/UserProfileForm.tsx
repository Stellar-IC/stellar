import { Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

export type UserProfileFormFormValues = {
  username: string;
};

interface UserProfileFormProps {
  onSubmit: (input: UserProfileFormFormValues) => void;
}

export const UserProfileForm = ({ onSubmit }: UserProfileFormProps) => {
  const { profile } = useAuthContext();
  const form = useForm({
    initialValues: {
      username: profile?.username || '',
    },
    validate: {
      // username: (value) => (/^\w+$/.test(value) ? null : 'Invalid username'),
    },
  });

  return (
    <form>
      <Stack>
        <TextInput
          label="Username"
          name="username"
          w="100%"
          {...form.getInputProps('username')}
          onChange={(e) => {
            form.getInputProps('username').onChange(e.currentTarget.value);
            onSubmit({
              username: e.currentTarget.value,
            });
          }}
        />
      </Stack>
    </form>
  );
};
