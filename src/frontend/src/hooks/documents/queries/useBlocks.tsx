import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import {
  fromLocalStorageBulk,
  fromShareable,
  toLocalStorageBulk,
} from '@/modules/domain/block/serializers';
import { Block, CanisterId, LocalStorageBlock } from '@/types';

import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import {
  Result_1 as BlockByUuidResult,
  ShareableBlock_v2 as ShareableBlock,
  UUID,
} from '../../../../../declarations/workspace/workspace.did';
import { useQuery } from '../../useQuery';

const getExternalId = (result: BlockByUuidResult): UUID | null =>
  'ok' in result ? result.ok.uuid : null;

export const useBlocks = (props: {
  workspaceId: CanisterId;
  identity: Identity;
  onSuccess?: (result: ShareableBlock) => void;
}) => {
  const { onSuccess: onSuccessFromProps, identity, workspaceId } = props;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const onSuccess = useCallback(
    (result: BlockByUuidResult) => {
      if (onSuccessFromProps && 'ok' in result) onSuccessFromProps(result.ok);
    },
    [onSuccessFromProps]
  );

  const serialize = useCallback((result: BlockByUuidResult) => {
    if (!('ok' in result)) return null;
    return fromShareable(result.ok);
  }, []);

  const { data, query, updateLocal } = useQuery<
    [UUID],
    BlockByUuidResult,
    Block,
    LocalStorageBlock
  >('blockByUuid', actor.blockByUuid, {
    serialize,
    getExternalId,
    onSuccess,
    prepareForStorage: toLocalStorageBulk,
    prepareFromStorage: fromLocalStorageBulk,
  });

  return { data, query, updateLocal };
};
