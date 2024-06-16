import { Principal } from '@dfinity/principal';
import {
  ActionIcon,
  Anchor,
  Box,
  Container,
  Flex,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { toText } from '@stellar-ic/lseq-ts/Tree';
import { IconDotsVertical, IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ActionBar } from '@/components/ActionBar';
import { WorkspaceContext } from '@/contexts/WorkspaceContext/WorkspaceContext';
import { WorkspaceContextProvider } from '@/contexts/WorkspaceContext/WorkspaceContextProvider';
import { usePagesQuery } from '@/hooks/canisters/workspace/queries/usePagesQuery';
import { useCreatePageWithRedirect } from '@/hooks/canisters/workspace/updates/useCreatePageWithRedirect';
import { toLocalStorage } from '@/modules/blocks/serializers';
import { LocalStorageBlock } from '@/types';

import { _SERVICE } from '../../../../declarations/workspace/workspace.did';

import classes from './SpaceHome.module.css';

interface SpaceHomePageProps {
  workspaceActor: _SERVICE;
  workspaceId: string;
}

export function SpaceHomePage({
  workspaceActor,
  workspaceId,
}: SpaceHomePageProps) {
  const theme = useMantineTheme();
  const createPageAndRedirect = useCreatePageWithRedirect({
    workspaceId: Principal.fromText(workspaceId),
  });

  const queryPages = usePagesQuery();

  const [pages, setPages] = useState<LocalStorageBlock[]>([]);
  const [workspace, setWorkspace] = useState<{ name: string } | null>(null);
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    queryPages().then((result) => {
      setPages(result.map(toLocalStorage));
    });
  }, [queryPages]);

  useEffect(() => {
    workspaceActor.details().then((result) => {
      if ('err' in result) {
        if ('unauthorized' in result.err) {
          setShowUnauthorized(true);
        }
        return;
      }

      setWorkspace({ name: result.ok.name });
    });
  }, [workspaceActor]);

  return showUnauthorized ? (
    <>
      <ActionBar />
      <Box className={classes.SpaceHeader} py="md">
        <Container>
          <Title style={{ textAlign: 'center' }}>
            Only members can access this Space
          </Title>
        </Container>
      </Box>
    </>
  ) : (
    <>
      <ActionBar />
      <Box className={classes.SpaceHeader} py="md">
        <Container>
          <Text size="xs" fw={500} c="dimmed">
            Space
          </Text>
          <Flex align="center" justify="space-between">
            <Title>{workspace?.name || 'Untitled'}</Title>
            <Menu position="bottom-end">
              <MenuTarget>
                <ActionIcon variant="subtle">
                  <IconDotsVertical />
                </ActionIcon>
              </MenuTarget>
              <MenuDropdown>
                <MenuItem>
                  <Anchor
                    component={Link}
                    to={`/spaces/${workspaceId}/settings`}
                    underline="never"
                  >
                    Settings
                  </Anchor>
                </MenuItem>
              </MenuDropdown>
            </Menu>
          </Flex>
        </Container>
      </Box>
      <Container>
        <div style={{ padding: theme.spacing.sm }}>
          <Flex align="center" justify="space-between">
            <h2>Pages</h2>
            <ActionIcon
              variant="subtle"
              onClick={createPageAndRedirect}
              aria-label="Create a new page"
            >
              <IconPlus />
            </ActionIcon>
          </Flex>
          <Stack>
            {pages.map((page) => (
              <Anchor
                key={page.uuid}
                component={Link}
                to={`/spaces/${workspaceId}/pages/${page.uuid}`}
              >
                {toText(page.properties.title) || 'Untitled'}
              </Anchor>
            ))}
          </Stack>
        </div>
      </Container>
    </>
  );
}

export function SpaceHomePageConnector() {
  const { spaceId: workspaceId } = useParams<{ spaceId: string }>();

  if (!workspaceId) throw new Error('Missing workspaceId');

  return (
    <WorkspaceContextProvider workspaceId={Principal.fromText(workspaceId)}>
      <WorkspaceContext.Consumer>
        {(context) => {
          if (!context) return null;
          if (!context.actor) return null;
          return (
            <SpaceHomePage
              workspaceId={workspaceId}
              workspaceActor={context.actor}
            />
          );
        }}
      </WorkspaceContext.Consumer>
    </WorkspaceContextProvider>
  );
}
