import type { Principal } from '@dfinity/principal';
import {
  Text,
  Group,
  ActionIcon,
  Tooltip,
  rem,
  useMantineTheme,
  Button,
  Flex,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Tree } from '@stellar-ic/lseq-ts';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { parse } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useCreatePageWithRedirect } from '@/hooks/documents/updates/useCreatePageWithRedirect';
import { useDeletePage } from '@/hooks/ic/workspace/updates/useDeletePage';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Block } from '@/types';

import { AuthButton } from '../AuthButton/AuthButton';
import { PrincipalBadge } from '../PrincipalBadge';

import classes from './NavbarSearch.module.css';

function PageLinksSection() {
  const { store } = useDataStoreContext();
  const pages = Object.keys(store)
    .filter((key) => key.startsWith(DATA_TYPES.page))
    .map((key) => store[key]) as Block[];
  const createPageAndRedirect = useCreatePageWithRedirect();
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();
  const [deletePage] = useDeletePage({
    identity,
    workspaceId,
  });

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

  return (
    <nav className={classes.navbar}>
      <div className={classes.section}>
        <AuthButton />
      </div>
      <div className={classes.section}>
        <div
          style={{
            padding: theme.spacing?.xs,
            paddingTop: 0,
            textAlign: 'right',
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
          >
            Settings
          </Link>
        </div>
      </div>

      {workspaceId && <PageLinksSection />}
    </nav>
  );
}
