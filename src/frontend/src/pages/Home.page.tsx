import { Box, Button, Stack, Text } from '@mantine/core';
import { toText } from '@stellar-ic/lseq-ts/Tree';
import { DEFAULT_BOUNDARY } from '@stellar-ic/lseq-ts/constants';
import { base } from '@stellar-ic/lseq-ts/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stringify } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useCreatePage } from '@/hooks/canisters/workspace/updates/useCreatePage';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { LocalStorageBlock } from '@/types';

function WorkspaceContent() {
  const navigate = useNavigate();
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();

  const [createPage] = useCreatePage({
    identity,
    workspaceId,
  });

  const pages = useLiveQuery<LocalStorageBlock[], LocalStorageBlock[]>(
    () => db.blocks.filter((block) => 'page' in block.blockType).toArray(),
    [],
    []
  );

  const createPageAndRedirect = useCallback(() => {
    createPage({
      content: {
        allocationStrategies: [],
        boundary: DEFAULT_BOUNDARY,
        rootNode: {
          base: base(0),
          children: [],
          deletedAt: [],
          identifier: [],
          value: '',
        },
      },
      parent: [],
      properties: {
        title: [],
        checked: [],
      },
    }).then((res) => {
      if ('err' in res) {
        // TODO: Handle error
        return;
      }

      const page = res.ok;
      navigate(`/pages/${stringify(page.uuid)}`);
    });
  }, [createPage, navigate]);

  return (
    <div>
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
    <Box style={{ width: '100%' }}>
      <WorkspaceContent />
    </Box>
  );
}
