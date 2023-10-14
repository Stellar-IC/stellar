import type { Principal } from '@dfinity/principal';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Tree } from '@/modules/lseq';
import {
  // TextInput,
  // Code,
  UnstyledButton,
  Badge,
  Text,
  Group,
  ActionIcon,
  Tooltip,
  rem,
  useMantineTheme,
} from '@mantine/core';
import {
  IconBulb,
  IconUser,
  IconCheckbox,
  // IconSearch,
  IconPlus,
} from '@tabler/icons-react';
import { useCreatePageWithRedirect } from '@/hooks/documents/updates/useCreatePageWithRedirect';
import { Link } from 'react-router-dom';
import { AuthButton } from '../AuthButton/AuthButton';
import classes from './NavbarSearch.module.css';

const links = [
  { icon: IconBulb, label: 'Activity', notifications: 3 },
  { icon: IconCheckbox, label: 'Tasks', notifications: 4 },
  { icon: IconUser, label: 'Contacts' },
];

function PageLinksSection() {
  const { pages } = usePagesContext();
  const createPageAndRedirect = useCreatePageWithRedirect();
  const pageLinks = Object.values(pages.data).map((page) => (
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

export function NavbarSearch({ workspaceId }: { workspaceId?: Principal }) {
  const theme = useMantineTheme();
  const mainLinks = links.map((link) => (
    <UnstyledButton key={link.label} className={classes.mainLink}>
      <div className={classes.mainLinkInner}>
        <link.icon size={20} className={classes.mainLinkIcon} stroke={1.5} />
        <span>{link.label}</span>
      </div>
      {link.notifications && (
        <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
          {link.notifications}
        </Badge>
      )}
    </UnstyledButton>
  ));

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
          {workspaceId && (
            <Text size="xs" ta="right">
              {workspaceId.toString()}
            </Text>
          )}
        </div>
      </div>

      {/* <TextInput
        placeholder="Search"
        size="xs"
        leftSection={
          <IconSearch
            style={{ width: rem(12), height: rem(12) }}
            stroke={1.5}
          />
        }
        rightSectionWidth={70}
        rightSection={<Code className={classes.searchCode}>Ctrl + K</Code>}
        styles={{ section: { pointerEvents: 'none' } }}
        mb="sm"
      />

      <div className={classes.section}>
        <div className={classes.mainLinks}>{mainLinks}</div>
      </div> */}

      {workspaceId && <PageLinksSection />}
    </nav>
  );
}
