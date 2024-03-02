import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { stringify } from 'uuid';

import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { fromShareable } from '@/modules/blocks/serializers';
import { IcListSerializer } from '@/modules/ic-serializers/IcListSerializer';
import { Activity, CanisterId } from '@/types';

import {
  ShareableActivity,
  UUID,
} from '../../../../../declarations/workspace/workspace.did';

export const useActivityLog = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });
  const { put } = useDataStoreContext();

  const activityLog = useCallback(
    (arg_0: UUID) =>
      actor.activityLog(arg_0).then((result) => {
        const serializer = new IcListSerializer<ShareableActivity, Activity>();
        const serialized = serializer.serialize(result, {
          fromShareable: (data) => ({
            uuid: stringify(data.uuid),
            blockExternalId: stringify(data.blockExternalId),
            endTime: data.endTime,
            startTime: data.startTime,
            edits: data.edits.map((edit) => ({
              blockValue: {
                before: edit.blockValue.before[0]
                  ? fromShareable(edit.blockValue.before[0])
                  : null,
                after: fromShareable(edit.blockValue.after),
              },
              startTime: BigInt(edit.startTime),
            })),
          }),
        });

        return serialized;
      }),
    [actor, put]
  );

  return activityLog;
};
