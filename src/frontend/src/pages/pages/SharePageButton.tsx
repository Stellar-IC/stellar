import {
  Button,
  Flex,
  Image,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { IconTriangleInvertedFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { parse } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';

import {
  PageAccessLevel,
  WorkspaceUser,
} from '../../../../declarations/workspace/workspace.did';

interface SharePageButtonProps {
  pageId: string;
}

export const SharePageButton = ({ pageId }: SharePageButtonProps) => {
  const theme = useMantineTheme();
  const workspaceContext = useWorkspaceContext();
  const { actor } = workspaceContext;

  if (!actor) throw new Error('Workspace Actor not found');

  const [invitedUsers, setInvitedUsers] = useState<
    {
      access: PageAccessLevel;
      user: WorkspaceUser;
    }[]
  >([]);

  useEffect(() => {
    actor.pageAccessSettings(parse(pageId)).then((res) => {
      setInvitedUsers(res.invitedUsers.map((entry) => entry));
    });
  }, [actor, pageId]);

  return (
    <Menu width="20rem">
      <MenuTarget>
        <Button variant="transparent" color="gray">
          Share
        </Button>
      </MenuTarget>
      <MenuDropdown>
        <Text size="xs">Who has access to this page?</Text>
        <form>
          <Stack gap="sm" my="sm">
            {invitedUsers.map((item) => {
              console.log(item);
              const { user, access } = item;
              const accessTextMap: { [key: string]: string } = {
                full: 'Full access',
                edit: 'Edit',
                view: 'View',
                none: 'No access',
              };

              return (
                <Flex align="center">
                  <Image
                    src="/user.png"
                    alt="User avatar"
                    width={30}
                    height={30}
                    style={{ borderRadius: '50%' }}
                  />
                  <Flex
                    flex={1}
                    direction="column"
                    style={{ marginLeft: theme.spacing?.sm }}
                  >
                    <Text size="sm">{user.username}</Text>
                  </Flex>
                  <Menu width="10rem">
                    <MenuTarget>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        rightSection={<IconTriangleInvertedFilled size="8px" />}
                      >
                        {accessTextMap[Object.keys(access)[0]]}
                      </Button>
                    </MenuTarget>
                    <MenuDropdown>
                      <MenuItem>Full access</MenuItem>
                      <MenuItem>Edit</MenuItem>
                      <MenuItem>View</MenuItem>
                      <MenuItem>No access</MenuItem>
                    </MenuDropdown>
                  </Menu>
                </Flex>
              );
            })}
          </Stack>
          <Menu width="10rem">
            <MenuTarget>
              <Button
                variant="outline"
                color="gray"
                size="xs"
                rightSection={<IconTriangleInvertedFilled size="8px" />}
              >
                Invite Only
              </Button>
            </MenuTarget>
            <MenuDropdown>
              <MenuItem>Invite Only</MenuItem>
              <MenuItem>Everyone in Stellar</MenuItem>
              <MenuItem>Everyone</MenuItem>
            </MenuDropdown>
          </Menu>
        </form>
      </MenuDropdown>
    </Menu>
  );
};
