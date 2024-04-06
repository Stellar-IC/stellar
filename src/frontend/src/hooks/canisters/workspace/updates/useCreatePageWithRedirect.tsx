import { DEFAULT_BOUNDARY } from '@stellar-ic/lseq-ts/constants';
import { base } from '@stellar-ic/lseq-ts/utils';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, stringify, v4 } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useCreatePage } from '@/hooks/canisters/workspace/updates/useCreatePage';
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
      initialBlockUuid: [parse(v4())],
    }).then((res) => {
      if ('err' in res) {
        return;
      }

      const page = res.ok;
      navigate(`/pages/${stringify(page.uuid)}`);
    });
  }, [createPage, navigate]);

  return createPageAndRedirect;
}
