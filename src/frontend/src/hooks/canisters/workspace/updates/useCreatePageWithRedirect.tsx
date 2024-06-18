import { Principal } from '@dfinity/principal';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, stringify, v4 } from 'uuid';

import { useCreatePage } from '@/hooks/canisters/workspace/updates/useCreatePage';
import { DEFAULT_BOUNDARY } from '@/modules/lseq/constants';
import { base } from '@/modules/lseq/utils';

type Options = {
  workspaceId: Principal;
};

export function useCreatePageWithRedirect({ workspaceId }: Options) {
  const navigate = useNavigate();
  const [createPage] = useCreatePage({
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
      navigate(`/spaces/${workspaceId}/pages/${stringify(page.uuid)}`);
    });
  }, [createPage, navigate, workspaceId]);

  if (!workspaceId) {
    return () => {};
  }

  return createPageAndRedirect;
}
