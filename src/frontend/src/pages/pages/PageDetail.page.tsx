import { Container, Stack } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { Blocks } from '@/components/blocks/Blocks';
import { Page } from '@/components/layout/page/Page';
import { useEffect } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
// import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useBlocksByPageUuid } from '@/hooks/documents/queries/useBlocksByPageUuid';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

export function PageDetailPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();
  const {
    pages: { data = {}, query: queryPage },
  } = usePagesContext();
  // const { store: dataStore } = useDataStoreContext();

  const blocksByPageUuid = useBlocksByPageUuid({
    identity,
    workspaceId,
  });

  if (!pageId) throw new Error('Missing pageId');

  useEffect(() => {
    queryPage(parse(pageId));
    blocksByPageUuid(pageId);
  }, [blocksByPageUuid, queryPage, pageId]);

  const page = data[pageId];

  if (!page) return <Page />;

  return (
    <Page>
      <Container maw="container.sm">
        <Stack mt="100" gap="xs" pl="10rem">
          <Blocks page={page} />
        </Stack>
      </Container>
    </Page>
  );
}
