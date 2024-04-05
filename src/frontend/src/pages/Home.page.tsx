import { Box, Button, Stack, Text, useMantineTheme } from '@mantine/core';
import { toText } from '@stellar-ic/lseq-ts/Tree';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';

import { PageWrapper } from '@/PageWrapper';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useCreatePageWithRedirect } from '@/hooks/canisters/workspace/updates/useCreatePageWithRedirect';
import { LocalStorageBlock } from '@/types';

function WorkspaceContent() {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { workspaceId } = useWorkspaceContext();
  const createPageAndRedirect = useCreatePageWithRedirect();

  const pages = useLiveQuery<LocalStorageBlock[], LocalStorageBlock[]>(
    () => db.blocks.filter((block) => 'page' in block.blockType).toArray(),
    [],
    []
  );

  return (
    <div style={{ padding: theme.spacing.sm }}>
      <Text>Workspace</Text>
      <Text>{workspaceId.toString()}</Text>
      <Button onClick={createPageAndRedirect}>Create new document</Button>
      <Text>Pages</Text>
      <Stack>
        {pages.map((page) => (
          <Button
            key={page.uuid}
            onClick={() => {
              navigate(`/pages/${page.uuid}`);
            }}
          >
            {toText(page.properties.title) || 'Untitled'}
          </Button>
        ))}
      </Stack>
    </div>
  );
}

export function HomePage() {
  return (
    <PageWrapper>
      <Box style={{ width: '100%' }}>
        <WorkspaceContent />
      </Box>
    </PageWrapper>
  );
}
