import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/domain/block/serializers';
import { IcResultSerializer } from '@/modules/ic-serializers/IcResultSerializer';
import { Block, CanisterId } from '@/types';

import {
  ShareableBlock,
  UUID,
} from '../../../../../../declarations/workspace/workspace.did';

export const useBlockByUuid = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });
  const { put } = useDataStoreContext();

  const blockByUuid = useCallback(
    (arg_0: UUID) =>
      actor
        .blockByUuid(arg_0)
        .then((result) => {
          const serializer = new IcResultSerializer<
            ShareableBlock,
            { blockNotFound: null },
            Block
          >();

          return serializer.serialize(result, {
            fromShareable: blockSerializers.fromShareable,
          });
        })
        .then((block) => {
          if (!block) return null;

          // Save to data store
          put(DATA_TYPES.block, block.uuid, block, {
            prepareForStorage: blockSerializers.toLocalStorage,
          });

          return block;
        }),
    [actor, put]
  );

  return blockByUuid;
};
