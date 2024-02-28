import { Container, Stack } from '@mantine/core';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { parse } from 'uuid';

import { Editor } from '@/components/Editor/Editor';
import { Page } from '@/components/layout/page/Page';
import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useBlocksByPageUuid } from '@/hooks/documents/queries/useBlocksByPageUuid';
import { usePageByUuid } from '@/hooks/ic/workspace/queries/usePageByUuid';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Block } from '@/types';

export function PageDetailPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();

  const pageByUuid = usePageByUuid({ identity, workspaceId });
  const blocksByPageUuid = useBlocksByPageUuid({
    identity,
    workspaceId,
  });

  if (!pageId) throw new Error('Missing pageId');

  useEffect(() => {
    pageByUuid(parse(pageId));
    blocksByPageUuid(pageId);
  }, [blocksByPageUuid, pageByUuid, pageId]);

  const { get } = useDataStoreContext();
  const page = get<Block>(DATA_TYPES.page, pageId);

  if (!page) return <Page>Page not found</Page>;

  return (
    <Page>
      <Container maw="container.sm">
        <Stack mt="100" gap="xs" pl="10rem">
          <Editor page={page} />
        </Stack>
      </Container>
    </Page>
  );
}
