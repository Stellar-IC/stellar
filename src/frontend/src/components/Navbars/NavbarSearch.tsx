import type { Principal } from '@dfinity/principal';
import {
  Text,
  Group,
  ActionIcon,
  Tooltip,
  rem,
  px,
  useMantineTheme,
  Button,
  Flex,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Tree } from '@stellar-ic/lseq-ts';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { parse } from 'uuid';

import { useLayoutManager } from '@/LayoutManager';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useCreatePageWithRedirect } from '@/hooks/canisters/workspace/updates/useCreatePageWithRedirect';
import { useDeletePage } from '@/hooks/canisters/workspace/updates/useDeletePage';
import { logout } from '@/modules/auth/commands';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { LocalStorageBlock } from '@/types';

import { PrincipalBadge } from '../PrincipalBadge';

import authButtonClasses from './AuthButton.module.css';
import classes from './NavbarSearch.module.css';

function PageLinksSection() {
  const createPageAndRedirect = useCreatePageWithRedirect();
  const { workspaceId } = useWorkspaceContext();
  const { layoutManager } = useLayoutManager();
  const theme = useMantineTheme();
  const { identity } = useAuthContext();
  const [deletePage] = useDeletePage({
    identity,
    workspaceId,
  });

  const pages = useLiveQuery<LocalStorageBlock[], LocalStorageBlock[]>(
    () => db.blocks.filter((block) => 'page' in block.blockType).toArray(),
    [],
    []
  );

  const xsBreakpoint = Number(`${px(theme.breakpoints.xs)}`.replace('px', ''));

  const pageLinks = Object.values(pages).map((page) => (
    <Flex justify="space-between" key={page.uuid}>
      <Link
        to={`/pages/${page.uuid}`}
        key={page.uuid}
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
        {/* <span style={{ marginRight: rem(9), fontSize: rem(16) }}>
        {page.emoji}
      </span>{' '} */}
        {Tree.toText(page.properties.title) || 'Untitled'}
      </Link>
      <Button
        leftSection={<IconTrash color="gray" size="1.25rem" />}
        onClick={() => {
          deletePage([{ uuid: parse(page.uuid) }])
            .then(() => {
              notifications.show({
                title: 'Success',
                message: `Deleted page '${page.uuid} '`,
              });
            })
            .catch((e) => {
              notifications.show({
                title: 'Error',
                message: e.message,
                color: 'red',
              });
            });
        }}
        variant="transparent"
      />
    </Flex>
  ));

  return (
    <div className={classes.section}>
      <Group className={classes.pagesHeader} justify="space-between">
        <Text size="xs" fw={500} c="dimmed">
          Pages
        </Text>
        <Tooltip label="Create page" withArrow position="right">
          <ActionIcon
            variant="default"
            size={18}
            onClick={() => {
              createPageAndRedirect();
            }}
          >
            <IconPlus
              style={{ width: rem(12), height: rem(12) }}
              stroke={1.5}
            />
          </ActionIcon>
        </Tooltip>
      </Group>
      <div className={classes.pages}>{pageLinks}</div>
    </div>
  );
}

export function NavbarSearch({
  workspaceId,
}: {
  workspaceId?: Principal | null;
}) {
  const theme = useMantineTheme();
  const { layout, layoutManager } = useLayoutManager();
  const isOpen = layout === 'NAVIGATION_OPEN';
  const { isAuthenticated, login, profile } = useAuthContext();

  const xsBreakpoint = Number(`${px(theme.breakpoints.xs)}`.replace('px', ''));

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
      <div className={classes.section}>
        <div className={authButtonClasses.section}>
          {isAuthenticated ? (
            <Flex>
              <Menu width="target">
                <MenuTarget>
                  <Button size="sm" variant="transparent">
                    {profile.username || '---'}
                  </Button>
                </MenuTarget>
                <MenuDropdown>
                  <MenuItem onClick={() => logout()}>Profile</MenuItem>
                  <MenuItem onClick={() => logout()}>Logout</MenuItem>
                </MenuDropdown>
              </Menu>
            </Flex>
          ) : (
            <Group>
              <Text>{profile.username}</Text>
              <Button size="sm" onClick={login}>
                Login
              </Button>
            </Group>
          )}
        </div>
      </div>
      <div className={classes.section}>
        <div
          style={{
            padding: theme.spacing.xs,
            paddingTop: 0,
          }}
        >
          <Text size="sm">Workspace</Text>
          {workspaceId && <PrincipalBadge principal={workspaceId} />}
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.pages}>
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
      </div>

      {workspaceId && <PageLinksSection />}
    </nav>
  );
}
