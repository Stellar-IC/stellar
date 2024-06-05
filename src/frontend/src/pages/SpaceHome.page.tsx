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
import { WorkspaceContextProvider } from '@/contexts/WorkspaceContext/WorkspaceContextProvider';
import { usePagesQuery } from '@/hooks/canisters/workspace/queries/usePagesQuery';
import { useCreatePageWithRedirect } from '@/hooks/canisters/workspace/updates/useCreatePageWithRedirect';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { toLocalStorage } from '@/modules/blocks/serializers';
import { LocalStorageBlock } from '@/types';

export function SpaceHomePage() {
  const { identity } = useAuthContext();
  const { spaceId } = useParams<{ spaceId: string }>();

  if (!spaceId) throw new Error('Missing workspaceId');

  const theme = useMantineTheme();
  const createPageAndRedirect = useCreatePageWithRedirect({
    workspaceId: Principal.fromText(spaceId),
  });

  const queryPages = usePagesQuery({
    identity,
    workspaceId: Principal.fromText(spaceId),
  });

  const [pages, setPages] = useState<LocalStorageBlock[]>([]);

  useEffect(() => {
    queryPages().then((result) => {
      setPages(result.map(toLocalStorage));
    });
  }, [queryPages]);

  if (!(identity instanceof DelegationIdentity)) {
    throw new Error('Anonymous identity is not allowed here');
  }

  return (
    <WorkspaceContextProvider
      identity={identity}
      workspaceId={Principal.fromText(spaceId)}
    >
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
                to={`/spaces/${spaceId}/pages/${page.uuid}`}
              >
                {toText(page.properties.title) || 'Untitled'}
              </Anchor>
            ))}
          </Stack>
        </div>
      </Container>
    </WorkspaceContextProvider>
  );
}
