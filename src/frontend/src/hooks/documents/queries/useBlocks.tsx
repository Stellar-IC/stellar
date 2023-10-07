import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';

import { useDocumentsActor } from '@/hooks/ic/actors/useDocumentsActor';
import {
  fromLocalStorageBulk,
  fromShareable,
  toLocalStorageBulk,
} from '@/modules/domain/block/serializers';
import { Block, LocalStorageBlock } from '@/types';

import {
  Result_1 as BlockByUuidResult,
  ShareableBlock,
  UUID,
} from '../../../../../declarations/documents/documents.did';
import { useQuery } from '../../useQuery';

const getExternalId = (result: BlockByUuidResult): UUID | null =>
  'ok' in result ? result.ok.uuid : null;

export const useBlocks = (props?: {
  identity?: Identity;
  onSuccess?: (result: ShareableBlock) => void;
}) => {
  const { onSuccess: onSuccessFromProps, identity } = props || {};
  const { actor } = useDocumentsActor({ identity });

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

  console.log({ blocks: data });

  return { data, query, updateLocal };
};
