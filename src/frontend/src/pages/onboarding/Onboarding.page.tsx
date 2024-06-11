import { Button, Card, Checkbox, Flex, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { useUpdateProfile } from '@/hooks/canisters/user/updates/useUpdateProfile';
import * as actorStore from '@/ic/actors/store';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import {
  canisterId as canisterIdForWorkspaceIndex,
  createActor as createActorForWorkspaceIndex,
} from '../../../../declarations/workspace_index';

export function OnboardingPage() {
  const form = useForm({
    initialValues: {
      username: '',
      termsOfService: false,
    },
    validate: {
      username: (value) => (/^\w+$/.test(value) ? null : 'Invalid username'),
    },
  });
  const { identity, userId, profile, setProfile } = useAuthContext();
  const [updateProfile] = useUpdateProfile({
    userId,
    identity,
  });

  return (
    <Flex align="center" justify="center" h="100%">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <h3>Let&apos;s get started</h3>
        <form
          onSubmit={form.onSubmit((values) => {
            const userActor = actorStore.actorStore.user?.getActor();

            if (!userActor) {
              throw new Error('User actor is not available');
            }

            updateProfile([{ username: values.username }]).then(async (res) => {
              if ('err' in res && 'usernameTaken' in res.err) {
                form.setErrors({ username: 'Username already taken' });
                return;
              }

              const userActor = actorStore.actorStore.user?.getActor();

              if (!userActor) {
                throw new Error('User actor is not available');
              }

              const [personalWorkspaceResult, profileResult] =
                await Promise.all([
                  userActor.personalWorkspace(),
                  userActor.profile(),
                ]);

              if ('err' in personalWorkspaceResult) {
                throw new Error('Failed to get user personal workspace');
              }

              if ('err' in profileResult) {
                throw new Error('Failed to get user profile');
              }

              const { username } = profileResult.ok;

              // Create a default workspace for the user if they don't have one.
              // This should always be the case for new users.
              if (personalWorkspaceResult.ok.length === 0) {
                const workspaceIndexActor = createActorForWorkspaceIndex(
                  canisterIdForWorkspaceIndex,
                  {
                    agentOptions: {
                      identity,
                    },
                  }
                );
                const createWorkspaceResult =
                  await workspaceIndexActor.createWorkspace({
                    name: `${username}'s space`,
                    description: 'Wow! My very own space',
                  });

                if ('err' in createWorkspaceResult) {
                  throw new Error('Failed to create user personal workspace');
                }

                const workspaceId = createWorkspaceResult.ok;
                const { actor: workspaceActor } =
                  actorStore.setWorkspace(workspaceId);

                await Promise.all([
                  userActor.setPersonalWorkspace(workspaceId),
                  workspaceActor.addUsers([
                    [
                      identity.getPrincipal(),
                      {
                        username,
                        role: { admin: null },
                        identity: identity.getPrincipal(),
                        canisterId: userId,
                      },
                    ],
                  ]),
                ]);
              }

              setProfile({ ...profile, username });
            });
          })}
        >
          <TextInput
            withAsterisk
            label="Username"
            placeholder="daringdragon"
            {...form.getInputProps('username')}
          />
          <Checkbox
            mt="md"
            label="I agree to adhere to Stellar's community guidelines and terms of service."
            {...form.getInputProps('termsOfService', { type: 'checkbox' })}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Submit</Button>
          </Group>
        </form>
      </Card>
    </Flex>
  );
}
