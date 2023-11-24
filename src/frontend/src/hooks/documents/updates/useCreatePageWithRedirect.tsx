import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { useCreatePage } from '@/hooks/documents/updates/useCreatePage';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { stringify } from 'uuid';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { DEFAULT_BOUNDARY } from '@myklenero/stellar-lseq-typescript/constants';
import { base } from '@myklenero/stellar-lseq-typescript/utils';

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

  return createPageAndRedirect;
}
