import { Container, Stack } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { parse } from 'uuid';

import { Editor } from '@/components/Editor/Editor';
import { Page } from '@/components/layout/page/Page';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useBlockQuery } from '@/hooks/canisters/workspace/queries/useBlockQuery';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

export function PageDetailPage() {
  const { pageId } = useParams<{ pageId: string }>();
  if (!pageId) throw new Error('Missing pageId');

  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();

  const queryPage = useBlockQuery({ identity, workspaceId });

  const page = useLiveQuery(() => db.blocks.get(pageId), [pageId]);

  useEffect(() => {
    queryPage(parse(pageId));
  }, [queryPage, pageId]);

  if (!page) return <Page>Page not found</Page>;

  return (
    <Page>
      <Container maw="container.sm">
        <Stack mt="100" gap="xs" px="10rem">
          <Editor page={page} />
        </Stack>
      </Container>
    </Page>
  );
}
