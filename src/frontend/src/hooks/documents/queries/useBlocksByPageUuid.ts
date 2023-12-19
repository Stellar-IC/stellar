import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/domain/block/serializers';
import { IcListSerializer } from '@/modules/ic-serializers/IcListSerializer';
import { Block, CanisterId } from '@/types';

import { ShareableBlock } from '../../../../../declarations/workspace/workspace.did';

export const useBlocksByPageUuid = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });
  const { put } = useDataStoreContext();

  const blocksByPageUuid = useCallback(
    async (arg_0: string) => {
      const result = await actor.blocksByPageUuid(arg_0);
      const blocks = new IcListSerializer<ShareableBlock, Block>().serialize(
        result,
        { fromShareable: blockSerializers.fromShareable }
      );

      blocks.forEach((block) => {
        put(DATA_TYPES.block, block.uuid, block, {
          prepareForStorage: blockSerializers.toLocalStorage,
        });
      });

      return blocks;
    },
    [actor, put]
  );

  return blocksByPageUuid;
};
