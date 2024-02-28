import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import * as blockSerializers from '@/modules/blocks/serializers';
import { IcListSerializer } from '@/modules/ic-serializers/IcListSerializer';
import { Block, CanisterId } from '@/types';

import { ShareableBlock } from '../../../../../../declarations/workspace/workspace.did';

export const useBlocksByPageUuid = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });
  const { put } = useDataStoreContext();

  const blocksByPageUuid = useCallback(
    async (uuid: string) => {
      const result = await actor.blocksByPageUuid(uuid);
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
