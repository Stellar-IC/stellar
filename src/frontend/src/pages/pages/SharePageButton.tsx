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
import { MouseEvent, useEffect, useState } from 'react';
import { parse } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import {
  PageAccessLevel,
  PageAccessSetting,
  WorkspaceUser,
} from '../../../../declarations/workspace/workspace.did';

interface SharePageButtonProps {
  pageId: string;
}

const accessTextMap: { [key: string]: string } = {
  full: 'Full access',
  edit: 'Edit',
  view: 'View',
  none: 'No access',
};

const pageAccessSettingTextMap: {
  [key: string]: string;
} = {
  invited: 'Invite Only',
  everyone: 'Everyone',
  workspaceMember: 'All Space Members',
};

const getPageAccessSettingText = (setting: PageAccessSetting) =>
  pageAccessSettingTextMap[Object.keys(setting)[0]];

interface SharePageMenuItemProps {
  access: PageAccessLevel;
  text: string;
  onAcessLevelChange: (access: PageAccessLevel) => void;
}

const SharePageMenuItem = ({
  access,
  text,
  onAcessLevelChange,
}: SharePageMenuItemProps) => {
  const theme = useMantineTheme();

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
        <Text size="sm">{text}</Text>
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
          <MenuItem
            onClick={() => {
              onAcessLevelChange({ full: null });
            }}
          >
            Full access
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAcessLevelChange({ edit: null });
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAcessLevelChange({ view: null });
            }}
          >
            View
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAcessLevelChange({ none: null });
            }}
          >
            No access
          </MenuItem>
        </MenuDropdown>
      </Menu>
    </Flex>
  );
};

export const SharePageButton = ({ pageId }: SharePageButtonProps) => {
  const workspaceContext = useWorkspaceContext();
  const { userId } = useAuthContext();
  const { actor } = workspaceContext;

  if (!actor) throw new Error('Workspace Actor not found');

  const [pageAccessSetting, setPageAccessSetting] = useState<PageAccessSetting>(
    { invited: null }
  );
  const [invitedUsers, setInvitedUsers] = useState<
    {
      access: PageAccessLevel;
      user: WorkspaceUser;
    }[]
  >([]);

  const accessSettingsForCurrentUser = invitedUsers.filter(
    (item) => item.user.canisterId.toString() === userId.toString()
  );
  const accessLevelForCurrentUser =
    accessSettingsForCurrentUser.length > 0
      ? accessSettingsForCurrentUser[0].access
      : { none: null };

  const canShare = ['full', 'edit'].includes(
    Object.keys(accessLevelForCurrentUser)[0]
  );

  useEffect(() => {
    actor.pageAccessSettings(parse(pageId)).then((res) => {
      setPageAccessSetting(res.accessSetting);
      setInvitedUsers(res.invitedUsers.map((entry) => entry));
    });
  }, [actor, pageId]);

  const onPageAccessSettingChange = (access: PageAccessSetting) => {
    actor.setPageAccessSettings({
      pageId: parse(pageId),
      access,
    });
    setPageAccessSetting(access);
  };

  const onWorkspaceMemberAccessChange = (access: PageAccessLevel) => {
    onPageAccessSettingChange({ workspaceMember: access });
  };

  const onEveryoneAccessChange = (access: PageAccessLevel) => {
    onPageAccessSettingChange({ everyone: access });
  };

  const onInvitedUserAccessChange = (
    user: WorkspaceUser,
    access: PageAccessLevel
  ) => {
    actor.setUserAccessLevelForPage({
      pageId: parse(pageId),
      userId: user.canisterId,
      accessLevel: access,
    });
  };

  if (!canShare) {
    return null;
  }

  return (
    <Menu
      width="20rem"
      closeOnClickOutside={false}
      closeOnItemClick={false}
      closeOnEscape
    >
      <MenuTarget>
        <Button variant="transparent" color="gray">
          Share
        </Button>
      </MenuTarget>
      <MenuDropdown>
        <Text size="xs">Who has access to this page?</Text>
        <form>
          <Stack gap="sm" my="sm">
            {'workspaceMember' in pageAccessSetting && (
              <SharePageMenuItem
                text={getPageAccessSettingText(pageAccessSetting)}
                access={pageAccessSetting.workspaceMember}
                onAcessLevelChange={onWorkspaceMemberAccessChange}
              />
            )}
            {'everyone' in pageAccessSetting && (
              <SharePageMenuItem
                text={getPageAccessSettingText(pageAccessSetting)}
                access={pageAccessSetting.everyone}
                onAcessLevelChange={onEveryoneAccessChange}
              />
            )}
            {invitedUsers.map((item) => {
              const { user, access } = item;

              return (
                <SharePageMenuItem
                  text={user.username}
                  access={access}
                  onAcessLevelChange={(access) => {
                    onInvitedUserAccessChange(user, access);
                  }}
                />
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
                {getPageAccessSettingText(pageAccessSetting)}
              </Button>
            </MenuTarget>
            <MenuDropdown>
              <MenuItem
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPageAccessSettingChange({ invited: null });
                }}
              >
                Invite Only
              </MenuItem>
              <MenuItem
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPageAccessSettingChange({
                    workspaceMember: {
                      view: null,
                    },
                  });
                }}
              >
                All Space Members
              </MenuItem>
              <MenuItem
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPageAccessSettingChange({
                    everyone: {
                      view: null,
                    },
                  });
                }}
              >
                Everyone
              </MenuItem>
            </MenuDropdown>
          </Menu>
        </form>
      </MenuDropdown>
    </Menu>
  );
};
