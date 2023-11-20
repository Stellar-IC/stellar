import { Box, Button, Stack, Text } from '@mantine/core';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { useCreatePage } from '@/hooks/documents/updates/useCreatePage';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { stringify } from 'uuid';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { toText } from '@/modules/lseq/Tree';
import { fromShareable } from '@/modules/domain/block/serializers';
import { DEFAULT_BOUNDARY } from '@/modules/lseq/constants';
import { base } from '@/modules/lseq/utils';
import { Edge } from '../../../declarations/workspace/workspace.did';

function WorkspaceContent() {
  const { identity } = useAuthContext();
  const { actor, workspaceId } = useWorkspaceContext();

  const [createPage] = useCreatePage({
    identity,
    workspaceId,
  });
  const [pages, setPages] = useState<[] | Edge[]>([]);

  useEffect(() => {
    actor
      .pages({
        order: [],
        cursor: [],
        limit: [],
      })
      .then((res) => {
        setPages(res.edges);
      });
  }, [actor]);

  const navigate = useNavigate();
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
            onClick={() => {
              navigate(`/pages/${stringify(page.node.uuid)}`);
            }}
          >
            {toText(fromShareable(page.node).properties.title) || 'Untitled'}
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
