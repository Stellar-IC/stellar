import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import {
  ActionIcon,
  Anchor,
  Container,
  Flex,
  Stack,
  useMantineTheme,
} from '@mantine/core';
import { toText } from '@stellar-ic/lseq-ts/Tree';
import { IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ActionBar } from '@/components/ActionBar';
import { WorkspaceContext } from '@/contexts/WorkspaceContext/WorkspaceContext';
import { WorkspaceContextProvider } from '@/contexts/WorkspaceContext/WorkspaceContextProvider';
import { usePagesQuery } from '@/hooks/canisters/workspace/queries/usePagesQuery';
import { useCreatePageWithRedirect } from '@/hooks/canisters/workspace/updates/useCreatePageWithRedirect';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { toLocalStorage } from '@/modules/blocks/serializers';
import { LocalStorageBlock } from '@/types';

export function SpaceHomePage({ workspaceId }: { workspaceId: string }) {
  const { identity } = useAuthContext();

  const theme = useMantineTheme();
  const createPageAndRedirect = useCreatePageWithRedirect({
    workspaceId: Principal.fromText(workspaceId),
  });

  const queryPages = usePagesQuery();

  const [pages, setPages] = useState<LocalStorageBlock[]>([]);

  useEffect(() => {
    queryPages().then((result) => {
      console.log('result', result);
      setPages(result.map(toLocalStorage));
    });
  }, [queryPages]);

  if (!(identity instanceof DelegationIdentity)) {
    throw new Error('Anonymous identity is not allowed here');
  }

  return (
    <>
      <ActionBar />
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
          return <SpaceHomePage workspaceId={workspaceId} />;
        }}
      </WorkspaceContext.Consumer>
    </WorkspaceContextProvider>
  );
}
