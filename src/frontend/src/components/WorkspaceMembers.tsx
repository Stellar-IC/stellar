import { Principal } from '@dfinity/principal';
import {
  Radio,
  Stack,
  Table,
  rem,
  Select,
  Title,
  Flex,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useMembersQuery } from '@/hooks/canisters/workspace/queries/useMembersQuery';
import { useUpdateUserRole } from '@/hooks/canisters/workspace/updates/useUpdateUserRole';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { WorkspaceUser } from '../../../declarations/workspace/workspace.did';

interface WorkspaceMemberProps {
  userId: Principal;
  username: string;
  role: 'admin' | 'member';
  onSave: () => void;
  onSaveSuccess: () => void;
  onSaveError: (e: Error) => void;
}

const WorkspaceMember = memo(
  ({
    userId,
    username,
    role,
    onSave,
    onSaveSuccess,
    onSaveError,
  }: WorkspaceMemberProps) => {
    const { identity } = useAuthContext();
    const { workspaceId } = useWorkspaceContext();
    const [_updateUserRole] = useUpdateUserRole({
      identity,
      workspaceId,
    });

    const updateUserRole = useMemo(() => {
      const fn = (role: string | null) => {
        onSave();

        if (!role) {
          return Promise.resolve();
        }

        const parsedRole =
          role === 'admin' ? { admin: null } : { member: null };

        return _updateUserRole([
          {
            role: parsedRole,
            user: userId,
          },
        ])
          .then((res) => {
            if ('err' in res) {
              onSaveError(new Error("Failed to update user's role"));
              return;
            }

            onSaveSuccess();
          })
          .catch(onSaveError);
      };

      return fn;
    }, [_updateUserRole, userId, onSave, onSaveError, onSaveSuccess]);

    return (
      <Table.Tr>
        <Table.Td>{username}</Table.Td>
        <Table.Td>
          <Radio.Group>
            <Stack gap={rem('4px')}>
              <Select
                aria-label="Choose role"
                placeholder="Choose role"
                required
                data={[
                  {
                    label: 'Admin',
                    value: 'admin',
                  },
                  {
                    label: 'Member',
                    value: 'member',
                  },
                ]}
                value={role}
                onChange={_.debounce(updateUserRole, 1000)}
              />
            </Stack>
          </Radio.Group>
        </Table.Td>
      </Table.Tr>
    );
  },
  (prevProps, nextProps) =>
    prevProps.userId.toText() === nextProps.userId.toText()
);

export const WorkspaceMembers = () => {
  const [members, setMembers] = useState<[Principal, WorkspaceUser][]>([]);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'success'>(
    'idle'
  );

  const queryMembers = useMembersQuery();

  useEffect(() => {
    // Fetch workspace members
    queryMembers().then((res) => {
      setMembers(res.recordMap.users);
    });
  }, [queryMembers]);

  const onSave = useCallback(() => {
    setSavingState('saving');
  }, []);

  const onSaveSuccess = useCallback(() => {
    setSavingState('success');
    setTimeout(() => {
      setSavingState('idle');
    }, 1000);
  }, []);

  const onSaveError = useCallback((e: Error) => {
    setSavingState('idle');

    notifications.show({
      title: 'Error saving settings',
      message: e.message,
      color: 'red',
    });
  }, []);

  const renderRows = useCallback(
    () =>
      members.map((member) => {
        const userId = member[0];
        const user = member[1];
        const { username, role } = user;
        const parsedRole = 'admin' in role ? 'admin' : 'member';

        return (
          <WorkspaceMember
            key={userId.toText()}
            userId={userId}
            username={username}
            role={parsedRole}
            onSave={onSave}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
        );
      }),
    [members, onSave, onSaveError, onSaveSuccess]
  );

  return (
    <Stack gap={rem('16px')}>
      <Flex justify="space-between" align="center">
        <Title order={2}>People</Title>
        <Text size="xs">
          {savingState === 'saving' && 'Saving...'}
          {savingState === 'success' && 'Saved!'}
        </Text>
      </Flex>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Username</Table.Th>
            <Table.Th>Role</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{renderRows()}</Table.Tbody>
      </Table>
    </Stack>
  );
};
