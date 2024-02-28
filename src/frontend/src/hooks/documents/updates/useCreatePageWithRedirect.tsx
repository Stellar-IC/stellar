import { DEFAULT_BOUNDARY } from '@stellar-ic/lseq-ts/constants';
import { base } from '@stellar-ic/lseq-ts/utils';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stringify } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useCreatePage } from '@/hooks/documents/updates/useCreatePage';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

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
