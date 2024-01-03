import { Container, Stack } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { Blocks } from '@/components/blocks/Blocks';
import { Page } from '@/components/layout/page/Page';
import { useEffect } from 'react';
import { parse } from 'uuid';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useBlocksByPageUuid } from '@/hooks/documents/queries/useBlocksByPageUuid';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { DATA_TYPES } from '@/constants';
import { Block } from '@/types';
import { usePageByUuid } from '@/hooks/ic/workspace/queries/usePageByUuid';

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
          <Blocks page={page} />
        </Stack>
      </Container>
    </Page>
  );
}
