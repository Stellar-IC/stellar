import { Box, Button } from '@mantine/core';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { useCreatePage } from '@/hooks/documents/updates/useCreatePage';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { stringify } from 'uuid';

export function HomePage() {
  const { identity } = useAuthContext();
  const [createPage] = useCreatePage({
    identity,
  });

  const navigate = useNavigate();
  const createPageAndRedirect = useCallback(() => {
    createPage({
      content: [],
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
    <Box style={{ width: '100%' }}>
      <Button onClick={createPageAndRedirect}>Create new document</Button>
    </Box>
  );
}
