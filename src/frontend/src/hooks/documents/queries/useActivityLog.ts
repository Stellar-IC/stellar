import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { stringify } from 'uuid';

import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { fromShareable } from '@/modules/blocks/serializers';
import { CanisterId } from '@/types';

import { UUID } from '../../../../../declarations/workspace/workspace.did';

export const useActivityLog = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const activityLog = useCallback(
    (arg_0: UUID) =>
      actor.activityLog(arg_0).then((result) => {
        const { edges } = result;
        const activities = edges.map((edge) => {
          const { node } = edge;

          return {
            ...node,
            uuid: stringify(node.uuid),
            blockExternalId: stringify(node.blockExternalId),
            endTime: node.endTime,
            startTime: node.startTime,
            edits: node.edits.map((edit) => ({
              ...edit,
              blockValue: {
                ...edit.blockValue,
                before: edit.blockValue.before[0]
                  ? fromShareable(edit.blockValue.before[0])
                  : null,
                after: fromShareable(edit.blockValue.after),
              },
              startTime: edit.startTime,
            })),
            users: node.users,
          };
        });

        return activities;
      }),
    [actor]
  );

  return activityLog;
};
