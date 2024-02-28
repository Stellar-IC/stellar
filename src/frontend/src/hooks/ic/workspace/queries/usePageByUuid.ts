import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/blocks/serializers';
import { CanisterId } from '@/types';

import { UUID } from '../../../../../../declarations/workspace/workspace.did';

export const usePageByUuid = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });
  const { put } = useDataStoreContext();

  const pageByUuid = useCallback(
    (arg_0: UUID) =>
      actor
        .pageByUuid(arg_0)
        .then((result) => {
          if (!('ok' in result)) {
            return null;
          }

          const pageId = result.ok.page.uuid;
          const page = result.ok._records.blocks.find(
            (block) => block.uuid === pageId
          );

          if (!page) {
            return null;
          }

          return blockSerializers.fromShareable(page);
        })
        .then((block) => {
          if (!block) return null;

          // Save to data store
          put(DATA_TYPES.block, block.uuid, block, {
            prepareForStorage: blockSerializers.toLocalStorage,
          });
          put(DATA_TYPES.page, block.uuid, block, {
            prepareForStorage: blockSerializers.toLocalStorage,
          });

          return block;
        }),
    [actor, put]
  );

  return pageByUuid;
};
