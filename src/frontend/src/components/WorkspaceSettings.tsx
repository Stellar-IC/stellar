import { Group, Radio, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useSettingsQuery } from '@/hooks/canisters/workspace/queries/useSettingsQuery';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

export type WorkspaceSettingsFormValues = {
  name: string;
  visibility: { Public: null } | { Private: null };
  description: string;
  websiteLink: string;
};

interface WorkspaceSettingsProps {
  onSubmit: (input: WorkspaceSettingsFormValues) => void;
}

export const WorkspaceSettings = ({ onSubmit }: WorkspaceSettingsProps) => {
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const queryWorkspaceSettings = useSettingsQuery({
    identity,
    workspaceId,
  });
  const form = useForm({
    initialValues: {
      description: '',
      name: '',
      visibility: 'public',
      websiteLink: '',
    },
    validate: {
      // username: (value) => (/^\w+$/.test(value) ? null : 'Invalid username'),
    },
  });

  useEffect(() => {
    queryWorkspaceSettings().then((result) => {
      form.setValues({
        ...result,
        visibility: 'Public' in result.visibility ? 'public' : 'private',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryWorkspaceSettings]);

  return (
    <form>
      <Stack>
        <TextInput
          label="Name"
          //   description="Name of the workspace"
          name="name"
          w="100%"
          placeholder="Stellar"
          {...form.getInputProps('name')}
          onChange={(e) => {
            form.getInputProps('name').onChange(e.currentTarget.value);
            onSubmit({
              name: e.currentTarget.value,
              description: form.values.description,
              visibility:
                form.values.visibility === 'public'
                  ? { Public: null }
                  : { Private: null },
              websiteLink: form.values.websiteLink,
            });
          }}
        />

        <Radio.Group
          name="visibility"
          label="Visibility"
          description="Choose who can see this workspace"
          {...form.getInputProps('visibility')}
          onChange={(value) => {
            form.getInputProps('visibility').onChange(value);
            onSubmit({
              name: form.values.name,
              description: form.values.description,
              visibility:
                value === 'public' ? { Public: null } : { Private: null },
              websiteLink: form.values.websiteLink,
            });
          }}
        >
          <Group mt="xs">
            <Radio value="public" label="Public" />
            <Radio value="private" label="Private" />
          </Group>
        </Radio.Group>
      </Stack>
    </form>
  );
};
