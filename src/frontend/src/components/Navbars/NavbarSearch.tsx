import type { Principal } from '@dfinity/principal';
import { Tree } from '@stellar-ic/lseq-ts';
import {
  Text,
  Group,
  ActionIcon,
  Tooltip,
  rem,
  useMantineTheme,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useCreatePageWithRedirect } from '@/hooks/documents/updates/useCreatePageWithRedirect';
import { Link } from 'react-router-dom';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { DATA_TYPES } from '@/constants';
import { Block } from '@/types';
import { AuthButton } from '../AuthButton/AuthButton';
import classes from './NavbarSearch.module.css';
import { PrincipalBadge } from '../PrincipalBadge';

function PageLinksSection() {
  const { store } = useDataStoreContext();
  const pages = Object.keys(store)
    .filter((key) => key.startsWith(DATA_TYPES.page))
    .map((key) => store[key]) as Block[];
  const createPageAndRedirect = useCreatePageWithRedirect();
  const pageLinks = Object.values(pages).map((page) => (
    <Link
      to={`/pages/${page.uuid}`}
      key={page.uuid}
      className={classes.pageLink}
    >
      {/* <span style={{ marginRight: rem(9), fontSize: rem(16) }}>
        {page.emoji}
      </span>{' '} */}
      {Tree.toText(page.properties.title) || 'Untitled'}
    </Link>
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

      {workspaceId && <PageLinksSection />}
    </nav>
  );
}
