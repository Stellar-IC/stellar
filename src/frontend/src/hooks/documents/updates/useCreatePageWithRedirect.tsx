import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { useCreatePage } from '@/hooks/documents/updates/useCreatePage';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { stringify } from 'uuid';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';

export function useCreatePageWithRedirect() {
  const navigate = useNavigate();
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const [createPage] = useCreatePage({
    identity,
    workspaceId,
  });

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

  return createPageAndRedirect;
}
