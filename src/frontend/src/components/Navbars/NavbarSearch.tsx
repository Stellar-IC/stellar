import type { Principal } from '@dfinity/principal';
import {
  Text,
  Group,
  px,
  useMantineTheme,
  Button,
  Flex,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Stack,
  ActionIcon,
  Anchor,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLayoutManager } from '@/LayoutManager';
import { useUserActor } from '@/hooks/canisters/user/useUserActor';
import { logout } from '@/modules/auth/commands';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { workspace_index } from '../../../../declarations/workspace_index';

import classes from './NavbarSearch.module.css';

export function NavbarSearch() {
  const theme = useMantineTheme();
  const { layout, layoutManager } = useLayoutManager();
  const isOpen = layout === 'NAVIGATION_OPEN';
  const { identity, userId, isAuthenticated, login, profile } =
    useAuthContext();
  const { actor: userActor } = useUserActor({ identity, userId });

  const xsBreakpoint = Number(`${px(theme.breakpoints.xs)}`.replace('px', ''));

  const [workspaces, setWorkspaces] = useState<
    { id: Principal; name: string }[]
  >([]);

  useEffect(() => {
    userActor
      .workspaces()
      .then((result) => {
        if ('ok' in result) {
          return workspace_index.workspaceDetailsById(result.ok);
        }
        throw new Error(JSON.stringify(result.err));
      })
      .then((result) => {
        if ('err' in result) {
          throw new Error(JSON.stringify(result.err));
        }

        const workspacesToStore: WorkspaceDetails[] = [];
        result.ok.forEach((x) => {
          if ('notFound' in x.result) {
            return;
          }

          workspacesToStore.push({ id: x.id, name: x.result.found.name });
        });

        setWorkspaces(workspacesToStore);
      });
  }, [userActor]);

  const close = useCallback(() => {
    layoutManager.layout = 'CLOSED';
  }, [layoutManager]);

  const closeButton = (
    <ActionIcon
      className={classes.closeButton}
      onClick={close}
      variant="transparent"
      color="gray"
    >
      <IconX />
    </ActionIcon>
  );

  const logo = (
    <Anchor component={Link} to="/" onClick={close} underline="never">
      <Text className={classes.logo}>Stellar</Text>
    </Anchor>
  );

  return (
    <nav
      className={classes.navbar}
      style={
        isOpen
          ? { transition: '0.2s ease-in-out' }
          : {
              overflowX: 'hidden',
              width: 0,
              padding: 0,
              opacity: 0,
              transition: '0.2s ease-in-out',
            }
      }
    >
      <Flex>
        {logo}
        {closeButton}
      </Flex>
      <div className={classes.section}>
        {isAuthenticated ? (
          <Flex>
            <Menu>
              <MenuTarget>
                <Button size="sm" variant="transparent" px="xs">
                  {profile.username || '---'}
                </Button>
              </MenuTarget>
              <MenuDropdown>
                <MenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(userId.toString());
                  }}
                >
                  <div>
                    Copy User ID
                    <Text size="xs" c="dimmed">
                      {userId.toString()}
                    </Text>
                  </div>
                </MenuItem>
                <MenuItem onClick={() => logout()}>Logout</MenuItem>
              </MenuDropdown>
            </Menu>
          </Flex>
        ) : (
          <Group>
            <Text>{profile.username}</Text>
            <Button size="sm" onClick={login} px="xs">
              Login
            </Button>
          </Group>
        )}
      </div>

      {isAuthenticated && (
        <div className={classes.section}>
          <Link
            to="/settings"
            className={classes.pageLink}
            style={{
              flexGrow: 1,
              alignSelf: 'center',
            }}
            onClick={() => {
              if (document.body.clientWidth < xsBreakpoint) {
                layoutManager.layout = 'CLOSED';
              }
            }}
          >
            Settings
          </Link>
        </div>
      )}

      <div className={classes.section}>
        <WorkspacesSection workspaces={workspaces} />
      </div>
    </nav>
  );
}

function WorkspaceItem(props: { workspaceDetails: WorkspaceDetails }) {
  const { workspaceDetails } = props;
  const { id, name } = workspaceDetails;

  const theme = useMantineTheme();
  const { layoutManager } = useLayoutManager();

  const xsBreakpoint = Number(`${px(theme.breakpoints.xs)}`.replace('px', ''));

  return (
    <Link
      to={`/spaces/${id}`}
      onClick={() => {
        if (document.body.clientWidth < xsBreakpoint) {
          layoutManager.layout = 'CLOSED';
        }
      }}
    >
      <Flex gap="sm">
        <div
          style={{
            borderRadius: '0.25rem',
            backgroundColor: '#aaa',
            width: '2rem',
            height: '2rem',
          }}
        />
        <Text size="sm" style={{ marginTop: '0.5rem' }}>
          {name || 'Untitled'}
        </Text>
      </Flex>
    </Link>
  );
}

type WorkspaceDetails = {
  id: Principal;
  name: string;
};

function WorkspacesSection({ workspaces }: { workspaces: WorkspaceDetails[] }) {
  return (
    <div className={classes.section}>
      <Group className={classes.pagesHeader} justify="space-between">
        <Text size="xs" fw={500} c="dimmed">
          Spaces
        </Text>
      </Group>
      <div className={classes.pages}>
        <Stack px="xs" py="sm" gap="xs">
          {workspaces.map((workspace) => (
            <WorkspaceItem
              key={workspace.id.toText()}
              workspaceDetails={workspace}
            />
          ))}
        </Stack>
      </div>
    </div>
  );
}
